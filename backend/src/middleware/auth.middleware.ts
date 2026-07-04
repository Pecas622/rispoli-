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
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.access_token;

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
      // token inválido/expirado: seguir como anónimo, sin rechazar
    }
  }
  next();
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
