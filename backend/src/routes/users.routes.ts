import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

const updateSchema = z.object({
  name:   z.string().min(2).optional(),
  avatar: z.string().url().optional(),
  role:   z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
});

const USER_SELECT = {
  id: true, name: true, email: true,
  role: true, avatar: true, createdAt: true,
  _count: { select: { enrollments: true } },
} as const;

// GET /api/users — admin only
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Only admin can view other users
    if (req.user!.userId !== id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (req.user!.userId !== id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const data = updateSchema.parse(req.body);
    // Only admin can change roles
    if (data.role && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Solo el admin puede cambiar roles' });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
