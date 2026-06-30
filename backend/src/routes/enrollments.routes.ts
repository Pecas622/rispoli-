import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /api/enrollments/me — enrolled courses with progress
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.userId, paidAt: { not: null } },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add progress percentage for each course
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: req.user!.userId },
      select: { lessonId: true },
    });
    const completedIds = new Set(progress.map(p => p.lessonId));

    const result = enrollments.map(e => {
      const totalLessons = e.course.modules.reduce(
        (acc, m) => acc + m.lessons.length, 0
      );
      const completedLessons = e.course.modules.reduce(
        (acc, m) => acc + m.lessons.filter(l => completedIds.has(l.id)).length, 0
      );
      return {
        ...e,
        progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
        completedLessons,
        totalLessons,
      };
    });

    res.json({ enrollments: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/enrollments — admin: all enrollments
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user:   { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
});

// POST /api/enrollments/:courseId/free — enroll for free (admin or free courses)
router.post('/:courseId/free', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body as { userId?: string };
    const targetUserId = userId ?? req.user!.userId;

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: targetUserId, courseId } },
      update: { paidAt: new Date(), amount: 0 },
      create: { userId: targetUserId, courseId, paidAt: new Date(), amount: 0 },
    });
    res.status(201).json({ enrollment });
  } catch (err) {
    next(err);
  }
});

export { router as enrollmentsRouter };
