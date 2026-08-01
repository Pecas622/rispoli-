import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Un usuario puede ver el CONTENIDO completo (video/texto/recursos) de un curso si:
// - es ADMIN o INSTRUCTOR, o
// - tiene una inscripción paga (Enrollment.paidAt) y no reembolsada para ese courseId
async function canAccessCourseContent(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'INSTRUCTOR') return true;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { paidAt: true, refundedAt: true },
  });
  return !!enrollment?.paidAt && !enrollment.refundedAt;
}

// Oculta el contenido "pago" de una clase que no sea preview (video, texto, recursos)
function maskLesson<T extends { isPreview: boolean; videoUrl: string | null; content: string | null; resources?: any[] }>(
  lesson: T,
  unlocked: boolean,
): T {
  if (unlocked || lesson.isPreview) return lesson;
  return { ...lesson, videoUrl: null, content: null, resources: [] };
}

const moduleSchema = z.object({
  title:       z.string().min(2),
  description: z.string().nullable().optional(),
  order:       z.number().int().positive(),
});

const reorderSchema = z.array(z.object({
  id:    z.string(),
  order: z.number().int().positive(),
}));

// GET /api/courses/:courseId/modules
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ message: 'Falta courseId' });

    const unlocked = await canAccessCourseContent(req.user!.userId, req.user!.role, courseId);

    const modules = await prisma.module.findMany({
      where:   { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { resources: true },
        },
      },
    });

    const safeModules = modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => maskLesson(l, unlocked)),
    }));

    res.json({ modules: safeModules, unlocked });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:courseId/modules
router.post('/', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = moduleSchema.parse(req.body);
    const mod  = await prisma.module.create({
      data:    { ...data, courseId: req.params.courseId },
      include: { lessons: { include: { resources: true } } },
    });
    res.status(201).json({ module: mod });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/modules/:id
router.patch('/:id', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = moduleSchema.partial().parse(req.body);
    const mod  = await prisma.module.update({ where: { id: req.params.id }, data });
    res.json({ module: mod });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/modules/:id
router.delete('/:id', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ message: 'Módulo eliminado' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/courses/:courseId/modules/reorder
router.put('/reorder', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = reorderSchema.parse(req.body);
    await Promise.all(
      items.map(({ id, order }) => prisma.module.update({ where: { id }, data: { order } }))
    );
    res.json({ message: 'Orden actualizado' });
  } catch (err) {
    next(err);
  }
});

export { router as modulesRouter };
