import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { getStripe, isStripeReady } from '../lib/stripe';
import { isMercadoPagoReady } from '../lib/mercadopago';
import { prisma } from '../lib/prisma';
import { sendPurchaseConfirmationEmail } from '../lib/email';
import { sendMetaEvent } from '../lib/capi';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ── Guards ────────────────────────────────────────────────────────────────────

function requireStripe(_req: Request, res: Response, next: NextFunction) {
  if (!isStripeReady()) {
    return res.status(503).json({
      message: 'El sistema de pagos (Stripe) aún no está configurado. Agregá STRIPE_SECRET_KEY al .env.',
      code: 'STRIPE_NOT_CONFIGURED',
    });
  }
  next();
}

function requireMercadoPago(_req: Request, res: Response, next: NextFunction) {
  if (!isMercadoPagoReady()) {
    return res.status(503).json({
      message: 'Mercado Pago aún no está configurado. Agregá MP_ACCESS_TOKEN al .env.',
      code: 'MP_NOT_CONFIGURED',
    });
  }
  next();
}

// ── Stripe — checkout internacional (USD) ─────────────────────────────────────
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

      // Usar priceUSD para Stripe (pagos internacionales)
      const unitAmount = course.priceUSD != null
        ? Math.round(course.priceUSD * 100)
        : Math.round(course.price * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode:   'payment',
        locale: 'auto',
        line_items: [{
          price_data: {
            currency:     'usd',
            product_data: {
              name:        course.title,
              description: course.subtitle ?? undefined,
              images:      course.image ? [course.image] : [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        }],
        metadata: {
          userId:   req.user!.userId,
          courseId: course.id,
          provider: 'stripe',
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

// ── Stripe — webhook ──────────────────────────────────────────────────────────
// POST /api/payments/webhook
// IMPORTANTE: necesita raw body — se configura en app.ts antes de express.json()
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
      console.error('[Stripe Webhook] Firma inválida:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, courseId } = session.metadata as { userId: string; courseId: string };
      const amount = (session.amount_total ?? 0) / 100;

      try {
        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId, courseId } },
          update: { paidAt: new Date(), stripeSessionId: session.id, amount, paymentProvider: 'stripe', currency: 'USD' },
          create: { userId, courseId, stripeSessionId: session.id, paidAt: new Date(), amount, paymentProvider: 'stripe', currency: 'USD' },
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

          // Meta CAPI: Purchase server-side (la conversión que más importa).
          // event_id estable por sesión → se deduplica si el navegador también lo dispara.
          sendMetaEvent({
            eventName:      'Purchase',
            eventId:        `purchase_${session.id}`,
            eventSourceUrl: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${courseId}`,
            userData:       { email: user.email, externalId: userId },
            customData: {
              currency:     'USD',
              value:        amount,
              content_type: 'product',
              content_ids:  [courseId],
              content_name: course.title,
            },
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[Stripe Webhook] Error procesando inscripción:', err);
      }
    }

    res.json({ received: true });
  },
);

// ── Mercado Pago — checkout ARS ───────────────────────────────────────────────
// POST /api/payments/mercadopago/:courseId
//
// Para activar:
//   1. npm install mercadopago
//   2. Agregar MP_ACCESS_TOKEN al .env
//   3. Descomentar el bloque de código de abajo
router.post(
  '/mercadopago/:courseId',
  authenticate,
  requireMercadoPago,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
      if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user!.userId, courseId: course.id } },
      });
      if (existing?.paidAt) {
        return res.status(400).json({ message: 'Ya estás inscripto en este curso' });
      }

      const { getMPClient, Preference } = await import('../lib/mercadopago');
      const preference = new Preference(getMPClient());

      const response = await preference.create({
        body: {
          items: [{
            id:         course.id,
            title:      course.title,
            quantity:   1,
            unit_price: course.price,   // precio en ARS
            currency_id: 'ARS',
          }],
          payer: {
            // Se puede pre-completar con datos del usuario si los tenemos
          },
          metadata: {
            userId:   req.user!.userId,
            courseId: course.id,
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${course.id}`,
            failure: `${process.env.FRONTEND_URL}/cursos/${course.id}?payment=failed`,
            pending: `${process.env.FRONTEND_URL}/dashboard?payment=pending`,
          },
          auto_return:      'approved',
          notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook`,
          statement_descriptor: 'GO TRAVEL ACADEMY',
        },
      });

      res.json({ url: response.init_point });
    } catch (err) {
      next(err);
    }
  },
);

// ── Mercado Pago — webhook ────────────────────────────────────────────────────
// POST /api/payments/mercadopago/webhook
//
// MP envía notificaciones IPN a este endpoint.
// Verificar firma: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
router.post('/mercadopago/webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body as { type: string; data: { id: string } };

    if (type === 'payment') {
      const { getMPClient, Payment } = await import('../lib/mercadopago');
      const paymentApi = new Payment(getMPClient());
      const payment = await paymentApi.get({ id: Number(data.id) });

      if (payment.status === 'approved' && payment.metadata) {
        const { user_id: userId, course_id: courseId } = payment.metadata;
        const amount = payment.transaction_amount ?? 0;

        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId, courseId } },
          update: { paidAt: new Date(), mpPaymentId: data.id, amount, paymentProvider: 'mercadopago', currency: 'ARS' },
          create: { userId, courseId, mpPaymentId: data.id, paidAt: new Date(), amount, paymentProvider: 'mercadopago', currency: 'ARS' },
        });

        await prisma.course.update({
          where: { id: courseId },
          data:  { students: { increment: 1 } },
        });

        const [user, course] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
          prisma.course.findUnique({ where: { id: courseId }, select: { title: true, price: true } }),
        ]);
        if (user && course) {
          const invoiceNumber = `INV-MP-${Date.now().toString(36).toUpperCase()}`;
          sendPurchaseConfirmationEmail(user, course, amount, invoiceNumber).catch(console.error);

          // Meta CAPI: Purchase server-side (Mercado Pago, ARS).
          sendMetaEvent({
            eventName:      'Purchase',
            eventId:        `purchase_${data.id}`,
            eventSourceUrl: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${courseId}`,
            userData:       { email: user.email, externalId: userId },
            customData: {
              currency:     'ARS',
              value:        amount,
              content_type: 'product',
              content_ids:  [courseId],
              content_name: course.title,
            },
          }).catch(() => {});
        }
      }

      console.log('[MP Webhook] Payment notification received:', data.id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[MP Webhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Pagos (admin) ──────────────────────────────────────────────────────────────
// GET /api/payments — solo pagos aprobados (lo único que se persiste hoy)
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { paidAt: { not: null } },
        include: {
          user:   { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where: { paidAt: { not: null } } }),
    ]);

    const payments = enrollments.map(e => ({
      id:       e.id,
      user:     e.user,
      course:   e.course,
      amount:   e.amount,
      currency: e.currency,
      provider: e.paymentProvider,
      paidAt:   e.paidAt,
      status:   'aprobado' as const,
    }));

    res.json({ payments, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    next(err);
  }
});

// ── Historial de pagos ────────────────────────────────────────────────────────
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

// ── Estado de los procesadores ────────────────────────────────────────────────
// GET /api/payments/status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    stripe:       isStripeReady(),
    mercadopago:  isMercadoPagoReady(),
    currency:     process.env.STRIPE_CURRENCY ?? 'usd',
  });
});

export { router as paymentsRouter };
