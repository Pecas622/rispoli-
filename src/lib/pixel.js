// ── Meta Pixel + Conversions API (medición híbrida) ─────────────────────────────
// El Pixel ID es público. Configuralo en VITE_META_PIXEL_ID (.env local y en Vercel).
// Si no hay ID, el Pixel queda desactivado y no rompe nada.
//
// track(): dispara cada evento por DOS caminos con un mismo event_id
//   1) Pixel (navegador)  → window.fbq
//   2) CAPI  (servidor)   → POST /api/events, que lo reenvía a Meta
// Meta usa el event_id compartido para deduplicar (no contar dos veces).
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const API_URL       = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let loaded = false;

// Carga el script de Meta Pixel e inicializa. Se ejecuta una sola vez.
export function loadPixel() {
  if (loaded || !META_PIXEL_ID || typeof window === 'undefined') return;
  loaded = true;
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', META_PIXEL_ID);
}

function newEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

// Dispara un evento SOLO por el Pixel del navegador (opcionalmente con event_id
// para deduplicar con un evento que el servidor ya mandó, ej: Lead en el registro).
export function pixelTrack(event, params, eventId) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) window.fbq('track', event, params || {}, { eventID: eventId });
    else         window.fbq('track', event, params || {});
  }
}

// Dispara un evento por Pixel (navegador) + CAPI (servidor) con un mismo event_id.
export function track(event, params) {
  const eventId = newEventId();

  // 1) Pixel del navegador
  pixelTrack(event, params, eventId);

  // 2) CAPI (best-effort: no bloquea ni rompe si el backend no responde)
  try {
    fetch(`${API_URL}/events`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive:   true,
      body: JSON.stringify({
        eventName:      event,
        eventId,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        customData:     params || {},
        fbp:            getCookie('_fbp'),
        fbc:            getCookie('_fbc'),
      }),
    }).catch(() => {});
  } catch { /* noop */ }

  return eventId;
}
