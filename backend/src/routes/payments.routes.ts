import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import crypto from 'crypto';
import { getStripe, isStripeReady } from '../lib/stripe';
import { isMercadoPagoReady } from '../lib/mercadopago';
import { prisma } from '../lib/prisma';
import { sendPurchaseConfirmationEmail } from '../lib/email';
import { sendMetaEvent } from '../lib/capi';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Webhooks de Mercado Pago.
// Doc: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

// El id del recurso según el formato del aviso: MP manda varias variantes
//   ?data.id=123&type=payment   (WebHook v1.0)
//   ?id=123&topic=payment       (Feed v2.0)
//   { data: { id: 123 } }       (en el cuerpo)
function mpResourceId(req: Request): string | undefined {
  return (req.query['data.id'] as string | undefined)
      ?? (req.query.id as string | undefined)
      ?? (req.body?.data?.id != null ? String(req.body.data.id) : undefined);
}

// Valida la firma del webhook de Mercado Pago.
// Devuelve el motivo del rechazo para poder diagnosticarlo desde los logs:
// un 401 mudo no dice si falta la firma o si la clave no coincide.
function checkMPSignature(req: Request): { ok: boolean; reason?: string } {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.warn('[MP Webhook] MP_WEBHOOK_SECRET no configurado: la firma no se está validando.');
    return { ok: true };
  }

  const signatureHeader = req.headers['x-signature'] as string | undefined;
  if (!signatureHeader) return { ok: false, reason: 'no llegó el header x-signature' };

  const dataId = mpResourceId(req);
  if (!dataId) return { ok: false, reason: 'no se pudo determinar el id del recurso' };

  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    }),
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return { ok: false, reason: `x-signature con formato inesperado: "${signatureHeader}"` };

  // Mercado Pago arma el manifest con la plantilla
  //   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  // pero las partes cuyo valor no llega en el aviso deben OMITIRSE por
  // completo. Dejarlas vacías (request-id:;) genera otra firma y el aviso
  // se rechaza aunque la clave sea la correcta.
  const requestId = req.headers['x-request-id'] as string | undefined;
  const manifest = [
    `id:${String(dataId).toLowerCase()};`,
    requestId ? `request-id:${requestId};` : '',
    `ts:${ts};`,
  ].join('');

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  const iguales = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!iguales) {
    // El manifest no es secreto (la clave no se puede deducir de él): loguearlo
    // permite ver si el problema es el formato o la clave.
    return { ok: false, reason: `la firma no coincide — revisar MP_WEBHOOK_SECRET (manifest: "${manifest}")` };
  }
  return { ok: true };
}

// Datos del navegador que Meta usa para reconocer al usuario: las cookies del
// Pixel (_fbp identifica al visitante, _fbc guarda el clic en el anuncio), la
// IP y el dispositivo.
//
// Se capturan al CREAR el pago, que es el único momento en que tenemos al
// usuario delante: la confirmación llega después por webhook, un pedido que
// hace Mercado Pago desde sus servidores. Viajan en la metadata del pago para
// que el webhook pueda reenviarlos junto al evento Purchase.
//
// Las claves van en snake_case porque Mercado Pago las devuelve así.
function metaTrackingContext(req: Request): Record<string, string> {
  const fwd = req.headers['x-forwarded-for'];
  const ip = typeof fwd === 'string' && fwd
    ? fwd.split(',')[0].trim()
    : req.socket?.remoteAddress ?? '';
  return {
    fbp:       (req.body?.fbp as string | undefined) ?? '',
    fbc:       (req.body?.fbc as string | undefined) ?? '',
    client_ip: ip ?? '',
    // Stripe limita la metadata a 500 caracteres por valor.
    client_ua: ((req.headers['user-agent'] as string | undefined) ?? '').slice(0, 300),
  };
}

// Arma los datos de reconocimiento del evento Purchase combinando lo que
// guardamos al crear el pago (cookies, IP, dispositivo) con lo que sabemos del
// usuario. Cuantas más señales, mejor atribuye Meta la venta a la campaña.
function purchaseUserData(
  meta: Record<string, any> | null | undefined,
  user: { name?: string | null; phone?: string | null; email: string },
  userId: string,
) {
  const partes = (user.name ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    email:           user.email,
    phone:           user.phone ?? undefined,
    firstName:       partes[0],
    lastName:        partes.length > 1 ? partes.slice(1).join(' ') : undefined,
    externalId:      userId,
    fbp:             meta?.fbp || undefined,
    fbc:             meta?.fbc || undefined,
    clientIpAddress: meta?.client_ip || undefined,
    clientUserAgent: meta?.client_ua || undefined,
  };
}

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
          ...metaTrackingContext(req),
        },
        success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${course.id}`,
        cancel_url:  `${process.env.FRONTEND_URL}/cursos/${course.id}?payment=cancelled`,
        // Managed Payments (activado por defecto en la cuenta) exige tax_code
        // por producto, que no configuramos — lo desactivamos para esta sesión.
        // Cast a `any`: el SDK de stripe instalado puede no tener el tipo
        // todavía para este parámetro nuevo.
        ...({ managed_payments: { enabled: false } } as any),
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
          prisma.user.findUnique({ where: { id: userId },   select: { name: true, phone: true, email: true } }),
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
            userData:       purchaseUserData(session.metadata, user, userId),
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

// ── Mercado Pago — webhook ────────────────────────────────────────────────────
// POST /api/payments/mercadopago/webhook
//
// MP envía notificaciones IPN a este endpoint.
// Verificar firma: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
//
// IMPORTANTE: esta ruta va SÍ O SÍ antes de '/mercadopago/:courseId'. Express
// resuelve por orden de registro, así que si el checkout va primero atrapa esta
// URL tomando "webhook" como courseId, exige sesión y responde 401 a Mercado
// Pago. El handler de abajo no llega a ejecutarse nunca.
router.post('/mercadopago/webhook', async (req: Request, res: Response) => {
  try {
    // Mercado Pago avisa de varios temas (payment, merchant_order, etc.) y en
    // distintos formatos. Solo procesamos los de pago; el resto los damos por
    // recibidos con 200 para que MP no los marque como fallidos ni los reintente.
    const { type, data } = (req.body ?? {}) as { type?: string; data?: { id?: string } };
    const topic = (req.query.topic as string | undefined)
               ?? (req.query.type as string | undefined)
               ?? type;

    if (topic !== 'payment') {
      return res.json({ received: true, ignored: topic ?? 'desconocido' });
    }

    // Mercado Pago manda cada pago DOS veces, en dos formatos:
    //   ?data.id=<id>&type=payment   → webhook moderno (el configurado en el
    //                                  panel). Trae firma que sabemos validar.
    //   ?id=<id>&topic=payment       → feed heredado. Viene firmado con otro
    //                                  esquema, así que no lo podemos validar.
    // El moderno es el que procesa la venta; el heredado es un duplicado. Lo
    // damos por recibido para que no quede como fallido en el panel de MP.
    const esFeedHeredado = req.query['data.id'] === undefined && req.query.topic !== undefined;
    if (esFeedHeredado) {
      console.log('[MP Webhook] Aviso heredado (feed) ignorado — lo procesa el webhook moderno:', mpResourceId(req));
      return res.json({ received: true, ignored: 'feed-heredado' });
    }

    const check = checkMPSignature(req);
    if (!check.ok) {
      console.warn('[MP Webhook] Notificación rechazada:', check.reason);
      return res.status(401).json({ message: 'Firma inválida' });
    }

    const paymentId = mpResourceId(req);
    if (!paymentId) {
      console.warn('[MP Webhook] Aviso de pago sin id de recurso');
      return res.json({ received: true });
    }

    {
      const { getMPClient, Payment } = await import('../lib/mercadopago');
      const paymentApi = new Payment(getMPClient());
      const payment = await paymentApi.get({ id: Number(paymentId) });

      if (payment.status === 'approved' && payment.metadata) {
        const { user_id: userId, course_id: courseId } = payment.metadata;
        const amount = payment.transaction_amount ?? 0;

        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId, courseId } },
          update: { paidAt: new Date(), mpPaymentId: paymentId, amount, paymentProvider: 'mercadopago', currency: 'ARS' },
          create: { userId, courseId, mpPaymentId: paymentId, paidAt: new Date(), amount, paymentProvider: 'mercadopago', currency: 'ARS' },
        });

        await prisma.course.update({
          where: { id: courseId },
          data:  { students: { increment: 1 } },
        });

        const [user, course] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true, email: true } }),
          prisma.course.findUnique({ where: { id: courseId }, select: { title: true, price: true } }),
        ]);
        if (user && course) {
          const invoiceNumber = `INV-MP-${Date.now().toString(36).toUpperCase()}`;
          sendPurchaseConfirmationEmail(user, course, amount, invoiceNumber).catch(console.error);

          // Meta CAPI: Purchase server-side (Mercado Pago, ARS).
          sendMetaEvent({
            eventName:      'Purchase',
            eventId:        `purchase_${paymentId}`,
            eventSourceUrl: `${process.env.FRONTEND_URL}/dashboard?payment=success&course=${courseId}`,
            userData:       purchaseUserData(payment.metadata, user, userId),
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

      console.log('[MP Webhook] Payment notification received:', paymentId);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[MP Webhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

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

      const applyTransferDiscount = !!req.body?.transferDiscount && !!course.transferCode;
      const unitPrice = applyTransferDiscount ? Math.round(course.price * 0.9) : course.price;
      // Pago por transferencia = pago único; compra normal = hasta 6 cuotas (elegidas por el usuario).
      const installments = applyTransferDiscount ? 1 : Math.min(6, Math.max(1, Number(req.body?.installments) || 1));

      const { getMPClient, Preference } = await import('../lib/mercadopago');
      const preference = new Preference(getMPClient());

      const response = await preference.create({
        body: {
          items: [{
            id:         course.id,
            title:      applyTransferDiscount ? `${course.title} (10% OFF transferencia)` : course.title,
            quantity:   1,
            unit_price: unitPrice,   // precio en ARS, con descuento por transferencia si aplica
            currency_id: 'ARS',
          }],
          payer: {},
          payment_methods: { installments, default_installments: installments },
          metadata: {
            userId:   req.user!.userId,
            courseId: course.id,
            ...metaTrackingContext(req),
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
