// ── Almacenamiento de archivos (Supabase Storage) ───────────────────────────────
// Guarda el material de las clases (PDFs, etc.). Se usa la API REST directa en
// vez del SDK para no sumar una dependencia.
//
// Config (Railway → Variables):
//   SUPABASE_URL          → https://<proyecto>.supabase.co
//   SUPABASE_SERVICE_KEY  → service_role key (SECRETA: permite escribir)
//   SUPABASE_BUCKET       → opcional, por defecto "materiales"
//
// El bucket debe existir y ser público para que los alumnos puedan descargar.
// Si falta la configuración, la subida responde 503 con un mensaje claro en vez
// de fallar de forma silenciosa.

import crypto from 'crypto';

const SUPABASE_URL  = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET        = process.env.SUPABASE_BUCKET || 'materiales';

export function isStorageReady(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

// Deja el nombre apto para una URL, conservando algo legible para el alumno.
function safeName(name: string): string {
  const limpio = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // sin acentos
    .replace(/[^a-zA-Z0-9._-]+/g, '-')                  // sin espacios ni símbolos
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return limpio.slice(0, 120) || 'archivo';
}

export async function uploadFile(
  originalName: string,
  contentType: string,
  body: Buffer,
): Promise<{ url: string; path: string }> {
  if (!isStorageReady()) throw new Error('STORAGE_NOT_CONFIGURED');

  // Prefijo aleatorio: evita que dos archivos con el mismo nombre se pisen.
  const path = `${crypto.randomUUID()}/${safeName(originalName)}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType || 'application/octet-stream',
      'cache-control': '3600',
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.error('[Storage] Error subiendo archivo →', res.status, detalle);
    throw new Error(`UPLOAD_FAILED_${res.status}`);
  }

  return {
    path,
    url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(path)}`,
  };
}
