import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

async function canAccessCourseContent(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'INSTRUCTOR') return true;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { paidAt: true, refundedAt: true },
  });
  return !!enrollment?.paidAt && !enrollment.refundedAt;
}

function maskLesson<T extends { isPreview: boolean; videoUrl: string | null; content: string | null; resources?: any[] }>(
  lesson: T,
  unlocked: boolean,
): T {
  if (unlocked || lesson.isPreview) return lesson;
  return { ...lesson, videoUrl: null, content: null, resources: [] };
}

const resourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.string().nullable().optional(),
  url:  z.string().nullable().optional(),
});

const lessonSchema = z.object({
  title:       z.string().min(2),
  description: z.string().nullable().optional(),
  duration:    z.string().nullable().optional(),
  videoType:   z.enum(['youtube', 'vimeo', 'upload', 'url', 'none']).nullable().optional(),
  videoUrl:    z.string().nullable().optional(),
  contentType: z.enum(['video', 'text', 'both']).nullable().optional(),
  content:     z.string().nullable().optional(),
  isPreview:   z.boolean().optional(),
  order:       z.number().int().positive(),
  resources:   z.array(resourceSchema).optional(),
});

const reorderSchema = z.array(z.object({
  id:    z.string(),
  order: z.number().int().positive(),
}));

// GET /api/modules/:moduleId/lessons
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleId } = req.params;
    if (!moduleId) return res.status(400).json({ message: 'Falta moduleId' });

    const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
    if (!mod) return res.status(404).json({ message: 'Módulo no encontrado' });

    const unlocked = await canAccessCourseContent(req.user!.userId, req.user!.role, mod.courseId);

    const lessons = await prisma.lesson.findMany({
      where:   { moduleId },
      orderBy: { order: 'asc' },
      include: { resources: true },
    });

    res.json({ lessons: lessons.map(l => maskLesson(l, unlocked)), unlocked });
  } catch (err) {
    next(err);
  }
});

// GET /api/lessons/:id — una clase individual (para el visor del alumno)
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where:   { id: req.params.id },
      include: { resources: true, module: { select: { courseId: true, title: true } } },
    });
    if (!lesson) return res.status(404).json({ message: 'Clase no encontrada' });

    const unlocked = await canAccessCourseContent(req.user!.userId, req.user!.role, lesson.module.courseId);
    if (!unlocked && !lesson.isPreview) {
      return res.status(403).json({ message: 'Necesitás estar inscripto en el curso para ver esta clase' });
    }

    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

// POST /api/modules/:moduleId/lessons
router.post('/', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resources, ...lessonData } = lessonSchema.parse(req.body);
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        moduleId: req.params.moduleId,
        ...(resources?.length && { resources: { create: resources } }),
      },
      include: { resources: true },
    });
    res.status(201).json({ lesson });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/lessons/:id
router.patch('/:id', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resources, ...lessonData } = lessonSchema.partial().parse(req.body);

    await prisma.lesson.update({ where: { id: req.params.id }, data: lessonData });

    if (resources !== undefined) {
      await prisma.resource.deleteMany({ where: { lessonId: req.params.id } });
      if (resources.length > 0) {
        await prisma.resource.createMany({
          data: resources.map(r => ({ ...r, lessonId: req.params.id })),
        });
      }
    }

    const updated = await prisma.lesson.findUnique({
      where:   { id: req.params.id },
      include: { resources: true },
    });
    res.json({ lesson: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/lessons/:id
router.delete('/:id', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: 'Clase eliminada' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:moduleId/lessons/reorder
router.put('/reorder', authenticate, requireInstructor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = reorderSchema.parse(req.body);
    await Promise.all(
      items.map(({ id, order }) => prisma.lesson.update({ where: { id }, data: { order } }))
    );
    res.json({ message: 'Orden actualizado' });
  } catch (err) {
    next(err);
  }
});

export { router as lessonsRouter };
