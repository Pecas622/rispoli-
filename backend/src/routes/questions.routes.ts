import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

// Se monta en dos lugares (mismo patrón que lessons.routes.ts/modules.routes.ts):
//   /api/lessons/:lessonId/questions        → listar / crear pregunta
//   /api/questions                          → responder / eliminar por id
const router = Router({ mergeParams: true });

// Mismo criterio que el contenido de la clase: admin/instructor siempre, o
// alumno con inscripción paga, no reembolsada y no vencida (ver Enrollment.expiresAt).
async function canAccessCourseContent(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'INSTRUCTOR') return true;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { paidAt: true, refundedAt: true, expiresAt: true },
  });
  if (!enrollment?.paidAt || enrollment.refundedAt) return false;
  return !enrollment.expiresAt || enrollment.expiresAt > new Date();
}

const USER_SELECT = { id: true, name: true, avatar: true, role: true } as const;

const bodySchema = z.object({
  body: z.string().trim().min(3, 'Escribí un poco más').max(4000),
});

// GET /api/lessons/:lessonId/questions — foro de la clase (público entre los
// inscriptos al curso, no solo alumno-instructor)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: { module: { select: { courseId: true } } },
    });
    if (!lesson) return res.status(404).json({ message: 'Clase no encontrada' });

    const canAccess = await canAccessCourseContent(req.user!.userId, req.user!.role, lesson.module.courseId);
    if (!canAccess) return res.status(403).json({ message: 'Necesitás estar inscripto en el curso para ver las preguntas' });

    const questions = await prisma.question.findMany({
      where:   { lessonId },
      orderBy: { createdAt: 'asc' },
      include: {
        user:    { select: USER_SELECT },
        answers: { orderBy: { createdAt: 'asc' }, include: { user: { select: USER_SELECT } } },
      },
    });

    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

// POST /api/lessons/:lessonId/questions
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const { body } = bodySchema.parse(req.body);

    const lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: { module: { select: { courseId: true } } },
    });
    if (!lesson) return res.status(404).json({ message: 'Clase no encontrada' });

    const canAccess = await canAccessCourseContent(req.user!.userId, req.user!.role, lesson.module.courseId);
    if (!canAccess) return res.status(403).json({ message: 'Necesitás estar inscripto en el curso para preguntar' });

    const question = await prisma.question.create({
      data:    { lessonId, userId: req.user!.userId, body },
      include: { user: { select: USER_SELECT }, answers: true },
    });

    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
});

// POST /api/questions/:questionId/answers
router.post('/:questionId/answers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId } = req.params;
    const { body } = bodySchema.parse(req.body);

    const question = await prisma.question.findUnique({
      where:  { id: questionId },
      select: { lesson: { select: { module: { select: { courseId: true } } } } },
    });
    if (!question) return res.status(404).json({ message: 'Pregunta no encontrada' });

    const canAccess = await canAccessCourseContent(req.user!.userId, req.user!.role, question.lesson.module.courseId);
    if (!canAccess) return res.status(403).json({ message: 'Necesitás estar inscripto en el curso para responder' });

    const answer = await prisma.answer.create({
      data:    { questionId, userId: req.user!.userId, body },
      include: { user: { select: USER_SELECT } },
    });

    res.status(201).json({ answer });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/answers/:id — el autor o un admin/instructor
router.delete('/answers/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const answer = await prisma.answer.findUnique({ where: { id: req.params.id } });
    if (!answer) return res.status(404).json({ message: 'Respuesta no encontrada' });

    const isOwner = answer.userId === req.user!.userId;
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'INSTRUCTOR';
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'No podés eliminar esta respuesta' });

    await prisma.answer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Respuesta eliminada' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/:id — el autor o un admin/instructor
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question) return res.status(404).json({ message: 'Pregunta no encontrada' });

    const isOwner = question.userId === req.user!.userId;
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'INSTRUCTOR';
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'No podés eliminar esta pregunta' });

    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ message: 'Pregunta eliminada' });
  } catch (err) {
    next(err);
  }
});

export { router as questionsRouter };
