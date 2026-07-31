import { useEffect } from 'react';

const SITE_URL = 'https://gotravelacademy.com';
const DEFAULT_IMAGE = `${SITE_URL}/gta-logo.jpeg`;

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(path) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', `${SITE_URL}${path}`);
}

// Nota: esto ayuda a Google (ejecuta JS y lee estos tags/JSON-LD en su
// segunda pasada de rendering), pero NO alcanza para los crawlers de
// WhatsApp/Facebook/Twitter, que leen el HTML crudo sin ejecutar JS y por
// eso siempre van a ver el <title>/og:* genéricos de index.html. Para eso
// hace falta SSR o prerendering — a evaluar aparte.
// `jsonLd` acepta un objeto o un array de objetos (ej. Course + BreadcrumbList
// en la misma página) — Google soporta ambos formatos en un solo <script>.
export function useSEO({ title, description, image, path, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image ?? DEFAULT_IMAGE);
    setMeta('property', 'og:url', path ? `${SITE_URL}${path}` : undefined);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image ?? DEFAULT_IMAGE);
    if (path) setCanonical(path);

    let script;
    const jsonLdValue = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd;
    const hasJsonLd = Array.isArray(jsonLdValue) ? jsonLdValue.length > 0 : !!jsonLdValue;
    if (hasJsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLdValue);
      document.head.appendChild(script);
    }

    return () => { if (script) script.remove(); };
  }, [title, description, image, path, JSON.stringify(jsonLd)]);
}
