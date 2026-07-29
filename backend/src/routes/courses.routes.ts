import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// "Alumnos" mostrados públicamente = esta base + inscripciones pagas reales.
const STUDENTS_BASE = 3450;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const courseSchema = z.object({
  title:            z.string().min(3),
  subtitle:         z.string().optional(),
  description:      z.string().optional(),
  category:         z.string(),
  level:            z.string(),
  modality:         z.string().optional(),
  duration:         z.string().optional(),
  hours:            z.number().int().positive().optional(),
  price:            z.number().positive(),                         // ARS
  originalPrice:    z.number().positive().optional(),             // ARS original
  priceUSD:         z.number().positive().optional(),             // USD
  originalPriceUSD: z.number().positive().optional(),             // USD original
  image:            z.string().optional(),
    previewVideo:     z.string().optional(), // puede ser una URL absoluta o una ruta relativa
  featured:         z.boolean().optional(),
  published:        z.boolean().optional(),
  tags:             z.array(z.string()).optional(),
  requirements:     z.array(z.string()).optional(),
  includes:         z.array(z.string()).optional(),
  transferCode:     z.string().optional(),
  certifiedBy:      z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  targetAudience:     z.array(z.string()).optional(),
  instructorName:   z.string().optional(),
  instructorRole:   z.string().optional(),
  instructorAvatar: z.string().optional(),
  instructorBio:    z.string().optional(),
});

// GET /api/courses — public (admin ve también los no publicados)
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, level, search } = req.query as Record<string, string>;
    const isAdmin = req.user?.role === 'ADMIN';

    const courses = await prisma.course.findMany({
      where: {
        ...(!isAdmin && { published: true }),
        ...(category && category !== 'Todos' && { category }),
        ...(level    && level    !== 'Todos' && { level    }),
        ...(search   && {
          OR: [
            { title:       { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category:    { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: { where: { paidAt: { not: null } } },
          },
        },
      },
    });

    const reviewStats = await prisma.review.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courses.map(c => c.id) } },
      _avg:   { rating: true },
      _count: { _all: true },
    });
    const statsByCourseId = new Map(reviewStats.map(r => [r.courseId, r]));

    const result = courses.map(c => {
      const stats = statsByCourseId.get(c.id);
      return {
        ...c,
        students: STUDENTS_BASE + c._count.enrollments,
        rating:  stats ? round1(stats._avg.rating ?? 0) : 0,
        reviews: stats?._count._all ?? 0,
      };
    });

    res.json({ courses: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id — public (no publicados solo visibles para ADMIN)
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, duration: true,
                isPreview: true, order: true, videoType: true,
              },
            },
          },
        },
        _count: { select: { enrollments: { where: { paidAt: { not: null } } } } },
      },
    });

    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });
    if (!course.published && req.user?.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const reviewAgg = await prisma.review.aggregate({
      where:  { courseId: course.id },
      _avg:   { rating: true },
      _count: true,
    });

    res.json({
      course: {
        ...course,
        students: STUDENTS_BASE + course._count.enrollments,
        rating:  reviewAgg._count > 0 ? round1(reviewAgg._avg.rating ?? 0) : 0,
        reviews: reviewAgg._count,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses — admin
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data });
    res.status(201).json({ course });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/courses/:id — admin
router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = courseSchema.partial().parse(req.body);
    const course = await prisma.course.update({ where: { id: req.params.id }, data });
    res.json({ course });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/courses/:id — admin
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Curso eliminado' });
  } catch (err) {
    next(err);
  }
});

export { router as coursesRouter };
