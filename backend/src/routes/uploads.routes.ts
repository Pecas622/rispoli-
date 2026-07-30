// ── Subida de material de clase ─────────────────────────────────────────────────
// POST /api/uploads?name=<nombre-original>
//
// El archivo viaja como cuerpo crudo (no multipart) para no depender de una
// librería extra: el frontend manda el File directo y el nombre por query.
// Solo instructores y admin pueden subir.

import { Router, Request, Response } from 'express';
import express from 'express';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';
import { isStorageReady, uploadFile } from '../lib/storage';

const router = Router();

const MAX_MB = 25;

// Extensiones permitidas: material de clase, no ejecutables.
const EXT_PERMITIDAS = [
  'pdf', 'zip', 'rar', '7z',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
];

router.post(
  '/',
  authenticate,
  requireInstructor,
  express.raw({ type: '*/*', limit: `${MAX_MB}mb` }),
  async (req: Request, res: Response) => {
    if (!isStorageReady()) {
      return res.status(503).json({
        message: 'La subida de archivos no está configurada. Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY.',
        code: 'STORAGE_NOT_CONFIGURED',
      });
    }

    const name = (req.query.name as string | undefined)?.trim();
    if (!name) return res.status(400).json({ message: 'Falta el nombre del archivo' });

    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXT_PERMITIDAS.includes(ext)) {
      return res.status(400).json({ message: `Tipo de archivo no permitido (.${ext})` });
    }

    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ message: 'El archivo llegó vacío' });
    }

    try {
      const { url } = await uploadFile(name, req.headers['content-type'] || '', body);
      res.status(201).json({ url, name, size: body.length });
    } catch (err: any) {
      console.error('[Uploads] Falló la subida:', err?.message);
      res.status(502).json({ message: 'No se pudo subir el archivo. Probá de nuevo.' });
    }
  },
);

export { router as uploadsRouter };
