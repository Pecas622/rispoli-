import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendContactEmail } from '../lib/email';

const router = Router();

const contactSchema = z.object({
  name:    z.string().trim().min(2).max(120),
  email:   z.string().trim().email(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(5).max(4000),
});

// POST /api/contact — público, envía el mensaje a academygotravel@gmail.com
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = contactSchema.parse(req.body);
    await sendContactEmail(data);
    res.status(201).json({ message: 'Mensaje enviado' });
  } catch (err) {
    next(err);
  }
});

export { router as contactRouter };
