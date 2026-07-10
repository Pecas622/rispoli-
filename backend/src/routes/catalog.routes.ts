// ── Feed de catálogo para Meta (anuncios dinámicos) ─────────────────────────────
// GET /api/catalog/feed
// Expone los cursos publicados en formato RSS 2.0 con el namespace de Google
// Shopping (g:), que es el que lee el Catálogo de Meta. Se configura una vez en
// Meta como "feed programado" y Meta lo re-lee solo cada X horas, así el catálogo
// se mantiene sincronizado con la base sin intervención manual.
//
// IMPORTANTE: el <g:id> de cada curso es el mismo `course.id` que el frontend
// manda en content_ids (ViewContent / InitiateCheckout / Purchase). Ese match es
// lo que permite el retargeting dinámico.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const BRAND = 'Go Travel Academy';

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// CDATA seguro para texto rico (títulos/descripciones con caracteres especiales).
function cdata(s: string): string {
  return `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

function absoluteUrl(base: string, path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

router.get('/feed', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const site = (process.env.FRONTEND_URL || 'https://gotravelacademy.vercel.app').replace(/\/$/, '');

    const courses = await prisma.course.findMany({
      where:   { published: true },
      orderBy: { featured: 'desc' },
    });

    const items = courses.map((c) => {
      const link        = `${site}/cursos/${c.id}`;
      const image       = absoluteUrl(site, c.image) || `${site}/gta-logo.jpeg`;
      const description = c.subtitle || c.description || c.title;

      // Meta: <g:price> = precio de lista; <g:sale_price> = precio con descuento.
      const hasSale  = c.originalPrice != null && c.originalPrice > c.price;
      const regular  = hasSale ? c.originalPrice! : c.price;
      const priceTag = `<g:price>${regular.toFixed(2)} ARS</g:price>`;
      const saleTag  = hasSale ? `      <g:sale_price>${c.price.toFixed(2)} ARS</g:sale_price>\n` : '';

      return `    <item>
      <g:id>${xmlEscape(c.id)}</g:id>
      <g:title>${cdata(c.title)}</g:title>
      <g:description>${cdata(description)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(image)}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      ${priceTag}
${saleTag}      <g:brand>${cdata(BRAND)}</g:brand>
      <g:product_type>${cdata(c.category)}</g:product_type>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${cdata(`${BRAND} — Cursos`)}</title>
    <link>${xmlEscape(site)}</link>
    <description>${cdata('Catálogo de cursos de Go Travel Academy')}</description>
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

export { router as catalogRouter };
