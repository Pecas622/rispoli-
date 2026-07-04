import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

const resourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.string().optional(),
  url:  z.string().optional(),
});

const lessonSchema = z.object({
  title:       z.string().min(2),
  description: z.string().optional(),
  duration:    z.string().optional(),
  videoType:   z.enum(['youtube', 'vimeo', 'upload', 'url', 'none']).optional(),
  videoUrl:    z.string().optional(),
  contentType: z.enum(['video', 'text', 'both']).optional(),
  content:     z.string().optional(),
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
    const lessons = await prisma.lesson.findMany({
      where:   { moduleId: req.params.moduleId },
      orderBy: { order: 'asc' },
      include: { resources: true },
    });
    res.json({ lessons });
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
