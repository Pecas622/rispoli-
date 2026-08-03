import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { sendRefundEmail } from '../lib/email';

const router = Router();

// GET /api/enrollments/me — enrolled courses with progress
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.userId, paidAt: { not: null }, refundedAt: null },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true, title: true, resources: true } } },
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

// GET /api/enrollments — admin: all enrollments (opcionalmente filtradas por usuario)
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query as Record<string, string>;
    const enrollments = await prisma.enrollment.findMany({
      where: { ...(userId && { userId }) },
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
      update: { paidAt: new Date(), refundedAt: null, amount: 0 },
      create: { userId: targetUserId, courseId, paidAt: new Date(), amount: 0 },
    });
    res.status(201).json({ enrollment });
  } catch (err) {
    next(err);
  }
});

// POST /api/enrollments/:id/revoke — admin: revocar acceso a mano (ej. un
// reembolso que se gestionó fuera del sistema, antes de que existiera esta
// funcionalidad, o cualquier otro caso puntual). Deja al alumno en el mismo
// estado que un reembolso automático: pierde el acceso y le vuelve a
// aparecer la opción de comprar el curso.
router.post('/:id/revoke', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
    if (!enrollment) return res.status(404).json({ message: 'Inscripción no encontrada' });
    if (enrollment.refundedAt) return res.status(400).json({ message: 'Ya tenía el acceso revocado' });

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data:  { refundedAt: new Date() },
    });

    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: enrollment.userId }, select: { name: true, email: true } }),
      prisma.course.findUnique({ where: { id: enrollment.courseId }, select: { title: true, price: true } }),
    ]);
    if (user && course) sendRefundEmail(user, course).catch(console.error);

    res.json({ enrollment: updated });
  } catch (err) {
    next(err);
  }
});

export { router as enrollmentsRouter };
