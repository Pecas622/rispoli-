import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { sendCertificateAvailableEmail } from '../lib/email';

// Certificados que carga el equipo: el PDF se sube con /api/uploads (mismo
// almacenamiento que el material de las clases) y acá se asocia la URL
// resultante a un alumno y un curso.

const router = Router();

const COURSE_PUBLIC = { id: true, title: true, image: true, certifiedBy: true };

// GET /api/certificates/me — certificados del alumno logueado (no depende de
// que el acceso al curso siga vigente).
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where:   { userId: req.user!.userId },
      include: { course: { select: COURSE_PUBLIC } },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ certificates });
  } catch (err) { next(err); }
});

// GET /api/certificates/admin — para la pestaña Certificados del panel:
//   pending: inscripciones vigentes (pagas, no reembolsadas) que todavía no
//            tienen certificado, con el progreso de cada alumno en ese curso.
//   loaded:  certificados ya cargados.
router.get('/admin', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [enrollments, certificates] = await Promise.all([
      prisma.enrollment.findMany({
        where:  { paidAt: { not: null }, refundedAt: null, user: { deletedAt: null } },
        select: {
          userId: true, courseId: true, paidAt: true,
          user:   { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, modules: { select: { lessons: { select: { id: true } } } } } },
        },
      }),
      prisma.certificate.findMany({
        include: {
          user:   { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { uploadedAt: 'desc' },
      }),
    ]);

    const conCertificado = new Set(certificates.map(c => `${c.userId}:${c.courseId}`));
    const sinCertificado = enrollments.filter(e => !conCertificado.has(`${e.userId}:${e.courseId}`));

    const userIds = [...new Set(sinCertificado.map(e => e.userId))];
    const progressRows = userIds.length
      ? await prisma.lessonProgress.findMany({ where: { userId: { in: userIds } }, select: { userId: true, lessonId: true } })
      : [];
    const completadasPorAlumno = new Map<string, Set<string>>();
    for (const p of progressRows) {
      if (!completadasPorAlumno.has(p.userId)) completadasPorAlumno.set(p.userId, new Set());
      completadasPorAlumno.get(p.userId)!.add(p.lessonId);
    }

    const pending = sinCertificado.map(e => {
      const lessonIds = e.course.modules.flatMap(m => m.lessons.map(l => l.id));
      const hechas = completadasPorAlumno.get(e.userId) ?? new Set<string>();
      const completedLessons = lessonIds.filter(id => hechas.has(id)).length;
      return {
        userId:   e.userId,
        courseId: e.courseId,
        user:     e.user,
        course:   { id: e.course.id, title: e.course.title },
        paidAt:   e.paidAt,
        completedLessons,
        totalLessons: lessonIds.length,
        progressPercent: lessonIds.length ? Math.round((completedLessons / lessonIds.length) * 100) : 0,
      };
    }).sort((a, b) => b.progressPercent - a.progressPercent);

    res.json({ pending, loaded: certificates });
  } catch (err) { next(err); }
});

// La URL tiene que ser un PDF de nuestro almacenamiento (lo que devuelve
// /api/uploads), no un link cualquiera.
const STORAGE_PREFIX = `${(process.env.SUPABASE_URL || '').replace(/\/$/, '')}/storage/v1/object/public/`;
const saveSchema = z.object({
  userId:   z.string().min(1),
  courseId: z.string().min(1),
  fileUrl:  z.string().url()
    .refine(u => !process.env.SUPABASE_URL || u.startsWith(STORAGE_PREFIX), 'El archivo tiene que estar subido a la plataforma')
    .refine(u => /\.pdf$/i.test(new URL(u).pathname), 'El certificado tiene que ser un PDF'),
  fileName: z.string().trim().max(200).optional(),
});

// PUT /api/certificates — admin: carga (o reemplaza) el certificado de un
// alumno para un curso. Si es la primera vez, le avisa por mail.
router.put('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, courseId, fileUrl, fileName } = saveSchema.parse(req.body);

    const [user, course, previo] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { name: true, email: true } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { title: true, price: true } }),
      prisma.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } }),
    ]);
    if (!user)   return res.status(404).json({ message: 'Alumno no encontrado' });
    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

    const certificate = await prisma.certificate.upsert({
      where:  { userId_courseId: { userId, courseId } },
      update: { fileUrl, fileName },
      create: { userId, courseId, fileUrl, fileName },
    });

    // Solo en la primera carga: si se reemplaza (ej. para corregir un dato),
    // no le volvemos a escribir al alumno.
    if (!previo) sendCertificateAvailableEmail(user, course).catch(console.error);

    res.status(previo ? 200 : 201).json({ certificate, replaced: !!previo, emailed: !previo });
  } catch (err) { next(err); }
});

// DELETE /api/certificates/:id — admin: quita el certificado (el alumno deja
// de verlo; si terminó el curso vuelve a figurar como pendiente).
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existe = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!existe) return res.status(404).json({ message: 'Certificado no encontrado' });
    await prisma.certificate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export { router as certificatesRouter };
