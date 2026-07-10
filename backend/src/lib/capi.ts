// ── Meta Conversions API (CAPI) — medición server-side ──────────────────────────
// Manda eventos a Meta desde el servidor, en paralelo al Pixel del navegador.
// Se deduplica con el Pixel usando un mismo `eventId` (event_id).
//
// Config (Railway → Variables):
//   META_PIXEL_ID          → mismo ID que el Pixel del frontend (público)
//   META_CAPI_TOKEN        → token de acceso de la CAPI (SECRETO)
//   META_TEST_EVENT_CODE   → opcional, solo para la pestaña "Probar eventos" de Meta
//
// Si falta el token o el pixel, todo queda desactivado y no rompe nada.

import crypto from 'crypto';

const GRAPH_VERSION = 'v22.0';
const PIXEL_ID  = process.env.META_PIXEL_ID  || '';
const CAPI_TOKEN = process.env.META_CAPI_TOKEN || '';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

export function isCapiReady(): boolean {
  return Boolean(PIXEL_ID && CAPI_TOKEN);
}

// Meta exige la info personal (email, id) hasheada en SHA-256, normalizada
// (minúsculas y sin espacios alrededor).
function hash(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export interface CapiUserData {
  email?: string | null;
  externalId?: string | null;   // userId (identifica a la persona sin exponerla)
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;                 // cookie _fbp que setea el Pixel
  fbc?: string;                 // cookie _fbc (click id de Facebook)
}

export interface CapiEvent {
  eventName: string;
  eventId?: string;             // MISMO id que usa el Pixel → deduplicación
  eventSourceUrl?: string;
  actionSource?: 'website' | 'system_generated';
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

// Envía un evento a Meta. Best-effort: nunca lanza, solo loguea si falla,
// para no interrumpir el flujo que la llamó (pago, registro, etc.).
export async function sendMetaEvent(event: CapiEvent): Promise<void> {
  if (!isCapiReady()) return;

  const user_data: Record<string, unknown> = {};
  const em = hash(event.userData.email);
  if (em) user_data.em = [em];
  const extId = hash(event.userData.externalId);
  if (extId) user_data.external_id = [extId];
  if (event.userData.clientIpAddress) user_data.client_ip_address = event.userData.clientIpAddress;
  if (event.userData.clientUserAgent) user_data.client_user_agent = event.userData.clientUserAgent;
  if (event.userData.fbp) user_data.fbp = event.userData.fbp;
  if (event.userData.fbc) user_data.fbc = event.userData.fbc;

  const payload: Record<string, unknown> = {
    data: [{
      event_name:    event.eventName,
      event_time:    Math.floor(Date.now() / 1000),
      action_source: event.actionSource ?? 'website',
      ...(event.eventId       ? { event_id:         event.eventId }       : {}),
      ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
      user_data,
      ...(event.customData ? { custom_data: event.customData } : {}),
    }],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error('[Meta CAPI]', event.eventName, '→', res.status, await res.text());
    }
  } catch (err) {
    console.error('[Meta CAPI] Fallo enviando', event.eventName, err);
  }
}
