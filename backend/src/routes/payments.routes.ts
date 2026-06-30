import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { getStripe, isStripeReady } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { sendPurchaseConfirmationEmail } from '../lib/email';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Guard: devuelve 503 claro si Stripe no está configurado todavía
function requireStripe(_req: Request, res: Response, next: NextFunction) {
  if (!isStripeReady()) {
    return res.status(503).json({
      message: 'El sistema de pagos aún no está configurado. Contactá al administrador.',
      code:    'STRIPE_NOT_CONFIGURED',
    });
  }
  next();
}

// POST /api/payments/checkout/:courseId
router.post(
  '/checkout/:courseId',
  authenticate,
  requireStripe,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stripe = getStripe();
      const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
      if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user!.userId, courseId: course.id } },
      });
      if (existing?.paidAt) {
        return res.status(400).json({ message: 'Ya estás inscripto en este curso' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode:   'payment',
        locale: 'es',
        line_items: [{
          price_data: {
            currency:     process.env.STRIPE_CURRENCY ?? 'ars',
            product_data: {
              name:        course.title,
              description: course.subtitle ?? undefined,
              images:      course.image ? [course.image] : [],
            },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          userId:   req.user!.userId,
          courseId: course.id,
        },
        success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${course.id}`,
        cancel_url:  `${process.env.FRONTEND_URL}/cursos/${course.id}?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/payments/webhook  — Stripe llama a este endpoint tras cada pago
// IMPORTANTE: necesita raw body (se configura en app.ts antes de express.json)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    if (!isStripeReady()) {
      return res.status(503).json({ message: 'Stripe no configurado' });
    }

    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).send('Missing stripe-signature');

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error('[Webhook] Firma inválida:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, courseId } = session.metadata as { userId: string; courseId: string };
      const amount = (session.amount_total ?? 0) / 100;

      try {
        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId, courseId } },
          update: { paidAt: new Date(), stripeSessionId: session.id, amount },
          create: { userId, courseId, stripeSessionId: session.id, paidAt: new Date(), amount },
        });

        await prisma.course.update({
          where: { id: courseId },
          data:  { students: { increment: 1 } },
        });

        const [user, course] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId },   select: { name: true, email: true } }),
          prisma.course.findUnique({ where: { id: courseId }, select: { title: true, price: true } }),
        ]);
        if (user && course) {
          const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
          sendPurchaseConfirmationEmail(user, course, amount, invoiceNumber).catch(console.error);
        }
      } catch (err) {
        console.error('[Webhook] Error procesando inscripción:', err);
      }
    }

    res.json({ received: true });
  },
);

// GET /api/payments/history
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await prisma.enrollment.findMany({
      where:   { userId: req.user!.userId, paidAt: { not: null } },
      include: { course: { select: { id: true, title: true, image: true } } },
      orderBy: { paidAt: 'desc' },
    });
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/status — para verificar si Stripe está configurado
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    stripe:    isStripeReady(),
    currency:  process.env.STRIPE_CURRENCY ?? 'ars',
  });
});

export { router as paymentsRouter };
