import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma unique constraint violation → 409
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  }

  // Prisma record not found → 404
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }

  console.error('[ERROR]', err);

  const statusCode = err.statusCode ?? 500;
  const isProd = process.env.NODE_ENV === 'production';
  // En producción no devolvemos el mensaje crudo de errores 5xx (puede filtrar
  // detalles internos: queries de Prisma, paths, etc.). Los errores controlados
  // (4xx, con statusCode explícito) sí muestran su mensaje porque son mensajes
  // pensados para el usuario.
  const message = (!isProd || statusCode < 500)
    ? (err.message ?? 'Error interno del servidor')
    : 'Error interno del servidor';

  res.status(statusCode).json({ message });
}
