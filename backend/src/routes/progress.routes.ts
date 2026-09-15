import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/progress/:courseId — get completed lesson IDs + posiciones guardadas
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
      select: { lessonId: true, completedAt: true, videoPosition: true },
    });

    // Una fila puede existir solo para guardar la posición del video, sin que
    // la clase esté marcada como completada (completedAt null en ese caso).
    const completedRows = progress.filter(p => p.completedAt);
    const total     = lessonIds.length;
    const completed = completedRows.length;

    const positions: Record<string, number> = {};
    for (const p of progress) {
      if (p.videoPosition > 0) positions[p.lessonId] = p.videoPosition;
    }

    res.json({
      completedLessonIds: completedRows.map(p => p.lessonId),
      positions,
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
        userId:      req.user!.userId,
        lessonId:    req.params.lessonId,
        completedAt: new Date(),
      },
    });
    res.status(201).json({ progress: record });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/progress/lesson/:lessonId/position — guarda el segundo del video
// donde quedó el alumno, sin marcar la clase como completada.
router.patch('/lesson/:lessonId/position', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const position = Number(req.body?.position);
    if (!Number.isFinite(position) || position < 0) {
      return res.status(400).json({ message: 'Posición inválida' });
    }

    const record = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId:   req.user!.userId,
          lessonId: req.params.lessonId,
        },
      },
      update: { videoPosition: position },
      create: {
        userId:        req.user!.userId,
        lessonId:      req.params.lessonId,
        videoPosition: position,
      },
    });
    res.json({ position: record.videoPosition });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/progress/lesson/:lessonId — unmark lesson
// Solo limpia completedAt: si tenía posición de video guardada, se conserva
// (desmarcar "completada" no debería hacer perder el punto donde iba).
router.delete('/lesson/:lessonId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.lessonProgress.updateMany({
      where: {
        userId:   req.user!.userId,
        lessonId: req.params.lessonId,
      },
      data: { completedAt: null },
    });
    res.json({ message: 'Progreso eliminado' });
  } catch (err) {
    next(err);
  }
});

export { router as progressRouter };
