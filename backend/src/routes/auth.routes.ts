import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendVerificationEmail, sendWelcomeEmail, sendLoginCodeEmail, sendPasswordResetEmail } from '../lib/email';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  name:     z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge:   COOKIE_MAX_AGE_MS,
    path:     '/',
  };
}

function signToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] },
  );
}

function issueSession(res: Response, userId: string, role: string) {
  const token = signToken(userId, role);
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createAndSendCode(email: string): Promise<string> {
  await prisma.verificationCode.deleteMany({ where: { email } });
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  await prisma.verificationCode.create({ data: { email, code, expiresAt } });
  await sendVerificationEmail(email, code);
  return code;
}

async function createAndSendLoginCode(email: string): Promise<string> {
  await prisma.verificationCode.deleteMany({ where: { email } });
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  await prisma.verificationCode.create({ data: { email, code, expiresAt } });
  await sendLoginCodeEmail(email, code);
  return code;
}

// Solo en desarrollo: devuelve el código para poder probar sin email real
const DEV_EXPOSE = process.env.NODE_ENV !== 'production';
function devPayload(code: string) {
  return DEV_EXPOSE ? { devCode: code } : {};
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!existing.emailVerified) {
        // Reenviar código si el usuario existe pero no verificó
        const code = await createAndSendCode(email);
        return res.status(200).json({ requiresVerification: true, email, ...devPayload(code) });
      }
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash } });

    const code = await createAndSendCode(email);

    res.status(201).json({ requiresVerification: true, email, ...devPayload(code) });
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

    issueSession(res, user.id, user.role);
    res.json({ user });
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

    const code = await createAndSendCode(email);
    res.json({ message: 'Código reenviado', ...devPayload(code) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// Paso 1: valida credenciales y envía OTP al email
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Mismo mensaje para usuario inexistente, eliminado o contraseña incorrecta (evita user enumeration)
    if (!user || user.deletedAt) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    if (!user.emailVerified) {
      const code = await createAndSendCode(email);
      return res.status(403).json({
        code:    'EMAIL_NOT_VERIFIED',
        message: 'Verificá tu email antes de ingresar. Te reenviamos el código.',
        email,
        ...devPayload(code),
      });
    }

    // Credenciales válidas → enviar código de acceso al email (2FA)
    const code = await createAndSendLoginCode(email);
    return res.status(200).json({ requiresLoginCode: true, email, ...devPayload(code) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-login
// Paso 2: valida el OTP y devuelve el JWT
router.post('/verify-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = z.object({
      email: z.string().email(),
      code:  z.string().length(6),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified || user.deletedAt) {
      return res.status(401).json({ message: 'Acceso no autorizado' });
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ message: 'Código incorrecto' });
    }
    if (record.expiresAt < new Date()) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return res.status(400).json({ message: 'El código expiró. Iniciá sesión de nuevo.' });
    }

    // Código válido → limpiar y emitir JWT
    await prisma.verificationCode.deleteMany({ where: { email } });

    issueSession(res, user.id, user.role);
    const { passwordHash: _, emailVerified: __, ...safeUser } = user;

    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Sesión cerrada' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Siempre el mismo mensaje exista o no el email (evita user enumeration)
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    res.json({ message: 'Si el email existe, te enviamos instrucciones para restablecer tu contraseña' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = z.object({
      token:    z.string().min(1),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    }).parse(req.body);

    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record) {
      return res.status(400).json({ message: 'El enlace es inválido o ya fue usado' });
    }
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      return res.status(400).json({ message: 'El enlace expiró. Solicitá uno nuevo.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

    res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password — cambiar contraseña estando logueado
router.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findFirst({
      where:  { id: req.user!.userId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
