import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

const reviewSchema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

// GET /api/courses/:courseId/reviews — public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const reviews = await prisma.review.findMany({
      where:   { courseId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:courseId/reviews — solo alumnos con inscripción paga
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = reviewSchema.parse(req.body);

    const enrollment = await prisma.enrollment.findUnique({
      where:  { userId_courseId: { userId: req.user!.userId, courseId } },
      select: { paidAt: true, refundedAt: true },
    });
    if (!enrollment?.paidAt || enrollment.refundedAt) {
      return res.status(403).json({ message: 'Necesitás haber comprado el curso para dejar una reseña' });
    }

    const review = await prisma.review.upsert({
      where:  { userId_courseId: { userId: req.user!.userId, courseId } },
      update: { rating, comment },
      create: { userId: req.user!.userId, courseId, rating, comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

export { router as reviewsRouter };
