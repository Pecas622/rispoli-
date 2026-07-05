import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

const updateSchema = z.object({
  name:      z.string().min(2).optional(),
  avatar:    z.string().url().optional(),
  role:      z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
  isBlocked: z.boolean().optional(),
});

const USER_SELECT = {
  id: true, name: true, email: true,
  role: true, avatar: true, isBlocked: true, createdAt: true,
  _count: { select: { enrollments: true } },
} as const;

// GET /api/users — admin only (con paginación y búsqueda)
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query as Record<string, string>;
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const where = {
      deletedAt: null,
      ...(search
        ? { OR: [
            { name:  { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ] }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
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

    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: USER_SELECT });
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
// Soft delete: no se borra la fila de verdad, se marca como eliminada.
// Asi nunca se pierden sus compras (enrollments) ni su progreso, y se puede
// deshacer si fue un error. El usuario queda bloqueado y oculto de las listas.
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data:  { deletedAt: new Date(), isBlocked: true },
    });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
