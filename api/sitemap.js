// Sitemap dinámico: lista las páginas estáticas + una entrada por cada curso
// publicado, consultando el backend público (GET /api/courses) en vez de
// conectarse directo a la base — así no depende de credenciales nuevas y
// funciona apenas el backend de Railway esté arriba.
const SITE_URL = 'https://gotravelacademy.vercel.app';

const STATIC_PATHS = ['/', '/cursos', '/nosotros', '/contacto', '/empresas'];

export default async function handler(req, res) {
  let courses = [];
  const apiUrl = process.env.VITE_API_URL;

  if (apiUrl) {
    try {
      const r = await fetch(`${apiUrl}/courses`);
      if (r.ok) {
        const data = await r.json();
        courses = (data.courses ?? []).filter(c => c.published !== false);
      }
    } catch (err) {
      console.error('[sitemap] no se pudo consultar el backend:', err.message);
    }
  }

  const urlTags = [
    ...STATIC_PATHS.map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`),
    ...courses.map(c => {
      const lastmod = c.updatedAt ? `<lastmod>${c.updatedAt.slice(0, 10)}</lastmod>` : '';
      return `  <url><loc>${SITE_URL}/cursos/${c.id}</loc>${lastmod}</url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
