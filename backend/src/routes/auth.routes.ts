import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendVerificationEmail, sendWelcomeEmail } from '../lib/email';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  name:     z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] },
  );
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createAndSendCode(email: string) {
  await prisma.verificationCode.deleteMany({ where: { email } });
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  await prisma.verificationCode.create({ data: { email, code, expiresAt } });
  await sendVerificationEmail(email, code);
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!existing.emailVerified) {
        // Reenviar código si el usuario existe pero no verificó
        await createAndSendCode(email);
        return res.status(200).json({ requiresVerification: true, email });
      }
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash } });

    await createAndSendCode(email);

    res.status(201).json({ requiresVerification: true, email });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = z.object({
      email: z.string().email(),
      code:  z.string().length(6),
    }).parse(req.body);

    const record = await prisma.verificationCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ message: 'Código incorrecto' });
    }
    if (record.expiresAt < new Date()) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return res.status(400).json({ message: 'El código expiró. Solicitá uno nuevo.' });
    }

    const user = await prisma.user.update({
      where: { email },
      data:  { emailVerified: true },
      select: { id: true, name: true, email: true, role: true, avatar: true, emailVerified: true },
    });

    await prisma.verificationCode.deleteMany({ where: { email } });

    sendWelcomeEmail({ name: user.name, email: user.email }).catch(console.error);

    const token = signToken(user.id, user.role);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Email no encontrado' });
    if (user.emailVerified) return res.status(400).json({ message: 'El email ya fue verificado' });

    await createAndSendCode(email);
    res.json({ message: 'Código reenviado' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    if (!user.emailVerified) {
      await createAndSendCode(email);
      return res.status(403).json({
        code:    'EMAIL_NOT_VERIFIED',
        message: 'Verificá tu email antes de ingresar. Te reenviamos el código.',
        email,
      });
    }

    const token = signToken(user.id, user.role);
    const { passwordHash: _, emailVerified: __, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
