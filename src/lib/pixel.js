// ── Meta Pixel (medición client-side) ───────────────────────────────
// El Pixel ID es público. Configuralo en VITE_META_PIXEL_ID (.env local y en Vercel).
// Si no hay ID, todo queda desactivado y no rompe nada.
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

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

// Dispara un evento estándar del Pixel (solo si el Pixel está activo).
export function pixelTrack(event, params) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params || {});
  }
}
