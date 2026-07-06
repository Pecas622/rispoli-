const DOLAR_CACHE_KEY = 'dolar_rate_cache';
const DOLAR_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

// País por IP: primero el endpoint serverless de Vercel (header x-vercel-ip-country,
// sin servicios externos). En local ese endpoint no existe (no hay edge de Vercel),
// así que cae a ipapi.co como respaldo para poder seguir probando en dev.
export async function detectCountry() {
  try {
    const res = await fetch('/api/geo');
    if (res.ok) {
      const { country } = await res.json();
      if (country) return country;
    }
  } catch { /* seguimos al respaldo */ }

  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data.country_code) return data.country_code;
  } catch { /* sin datos, el caller decide el default */ }

  return null;
}

// Cotización del dólar (dolarapi.com, gratis, sin key) — cacheada unas horas
// para no pegarle a la API en cada carga de página.
export async function getDolarRate() {
  try {
    const cached = JSON.parse(localStorage.getItem(DOLAR_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < DOLAR_TTL_MS) return cached.rate;
  } catch { /* cache corrupto, la pedimos de nuevo */ }

  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
    const data = await res.json();
    const rate = data.venta ?? data.compra ?? null;
    if (rate) localStorage.setItem(DOLAR_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
    return rate;
  } catch {
    return null;
  }
}
