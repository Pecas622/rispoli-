import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/progress/:courseId — get completed lesson IDs for a course
router.get('/:courseId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        module: { courseId: req.params.courseId },
      },
      select: { id: true },
    });
    const lessonIds = lessons.map(l => l.id);

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId:   req.user!.userId,
        lessonId: { in: lessonIds },
      },
      select: { lessonId: true, completedAt: true },
    });

    const total     = lessonIds.length;
    const completed = progress.length;

    res.json({
      completedLessonIds: progress.map(p => p.lessonId),
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/lesson/:lessonId — mark lesson as completed
router.post('/lesson/:lessonId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId:   req.user!.userId,
          lessonId: req.params.lessonId,
        },
      },
      update: { completedAt: new Date() },
      create: {
        userId:   req.user!.userId,
        lessonId: req.params.lessonId,
      },
    });
    res.status(201).json({ progress: record });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/progress/lesson/:lessonId — unmark lesson
router.delete('/lesson/:lessonId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.lessonProgress.deleteMany({
      where: {
        userId:   req.user!.userId,
        lessonId: req.params.lessonId,
      },
    });
    res.json({ message: 'Progreso eliminado' });
  } catch (err) {
    next(err);
  }
});

export { router as progressRouter };
