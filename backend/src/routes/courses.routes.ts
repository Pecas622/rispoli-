import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

const courseSchema = z.object({
  title:         z.string().min(3),
  subtitle:      z.string().optional(),
  description:   z.string().optional(),
  category:      z.string(),
  level:         z.string(),
  modality:      z.string().optional(),
  duration:      z.string().optional(),
  hours:         z.number().int().positive().optional(),
  price:         z.number().positive(),
  originalPrice: z.number().positive().optional(),
  image:         z.string().url().optional(),
  featured:      z.boolean().optional(),
  published:     z.boolean().optional(),
});

// GET /api/courses — public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, level, search } = req.query as Record<string, string>;

    const courses = await prisma.course.findMany({
      where: {
        published: true,
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
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { modules: true, enrollments: true } },
      },
    });

    res.json({ courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id — public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });
    res.json({ course });
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
