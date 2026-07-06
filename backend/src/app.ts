import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { authRouter }        from './routes/auth.routes';
import { usersRouter }       from './routes/users.routes';
import { coursesRouter }     from './routes/courses.routes';
import { modulesRouter }     from './routes/modules.routes';
import { lessonsRouter }     from './routes/lessons.routes';
import { enrollmentsRouter } from './routes/enrollments.routes';
import { progressRouter }    from './routes/progress.routes';
import { paymentsRouter }    from './routes/payments.routes';
import { errorMiddleware }   from './middleware/error.middleware';

const app = express();

// ── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting: protección ante ataques de fuerza bruta
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutos
  max:             10,              // máx 10 intentos por IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.' },
});
const otpLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,               // OTP es más sensible: máx 5 intentos
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Demasiados intentos de verificación. Esperá 15 minutos.' },
});
const passwordResetLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.' },
});

// ── Stripe webhook needs raw body BEFORE express.json() ───
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── General middleware ─────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ─────────────────────────────────────────────
// Aplicar rate limits a los endpoints de autenticación
app.use('/api/auth/login',          authLimiter);
app.use('/api/auth/register',       authLimiter);
app.use('/api/auth/verify-email',   otpLimiter);
app.use('/api/auth/resend-code',    otpLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/change-password', passwordResetLimiter);

app.use('/api/auth',        authRouter);
app.use('/api/users',       usersRouter);
app.use('/api/courses',     coursesRouter);

// Nested: /api/courses/:courseId/modules
app.use('/api/courses/:courseId/modules', modulesRouter);
// Standalone module endpoints (PATCH / DELETE by id)
app.use('/api/modules',  modulesRouter);

// Nested: /api/modules/:moduleId/lessons
app.use('/api/modules/:moduleId/lessons', lessonsRouter);
// Standalone lesson endpoints
app.use('/api/lessons',  lessonsRouter);

app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/progress',    progressRouter);
app.use('/api/payments',    paymentsRouter);

// ── 404 ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// ── Global error handler ───────────────────────────────────
app.use(errorMiddleware);

export { app };
