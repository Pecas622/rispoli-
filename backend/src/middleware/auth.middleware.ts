import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Acceso denegado: se requiere rol ADMIN' });
  next();
}

export function requireInstructor(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!['ADMIN', 'INSTRUCTOR'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol INSTRUCTOR o ADMIN' });
  }
  next();
}
