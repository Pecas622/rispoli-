// ── Tracking server-side (CAPI) para eventos del navegador ──────────────────────
// POST /api/events
// El frontend manda { eventName, eventId, eventSourceUrl, customData } y acá lo
// enriquecemos con IP, user-agent, cookies de Facebook (_fbp/_fbc) y el userId
// (si está logueado) antes de reenviarlo a Meta. El mismo eventId que usó el
// Pixel permite que Meta deduplique.

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth.middleware';
import { sendMetaEvent, isCapiReady } from '../lib/capi';

const router = Router();

// Solo permitimos los eventos estándar que realmente usamos desde el navegador.
const ALLOWED_EVENTS = ['ViewContent', 'Lead', 'InitiateCheckout', 'Search', 'AddToCart'] as const;

const bodySchema = z.object({
  eventName:      z.enum(ALLOWED_EVENTS),
  eventId:        z.string().min(1).max(200).optional(),
  eventSourceUrl: z.string().url().max(2000).optional(),
  customData:     z.record(z.unknown()).optional(),
  fbp:            z.string().max(200).optional(),
  fbc:            z.string().max(400).optional(),
});

// Límite generoso pero que corta abuso (los eventos son varios por sesión).
const trackLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
});

// La IP real del usuario detrás del proxy de Railway/Vercel viene en x-forwarded-for.
function clientIp(req: Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || undefined;
}

router.post('/', trackLimiter, optionalAuth, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Evento inválido' });
  }

  // Respondemos ya: el envío a Meta es best-effort y no debe demorar al cliente.
  res.status(202).json({ received: true });

  if (!isCapiReady()) return;

  const { eventName, eventId, eventSourceUrl, customData, fbp, fbc } = parsed.data;
  sendMetaEvent({
    eventName,
    eventId,
    eventSourceUrl,
    actionSource: 'website',
    customData,
    userData: {
      externalId:      req.user?.userId,
      clientIpAddress: clientIp(req),
      clientUserAgent: req.headers['user-agent'],
      fbp:             fbp || req.cookies?._fbp,
      fbc:             fbc || req.cookies?._fbc,
    },
  }).catch(() => {});
});

export { router as trackRouter };
