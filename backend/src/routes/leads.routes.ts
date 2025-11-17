// routes/leads.routes.ts
import { Router } from 'express';
import { LeadsController } from '../controllers/leads.controller';
import { LeadsService } from '../services/leads.service';
import { EmailService } from '../services/email.service';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validation.middleware';
import { contactRateLimit } from '../middleware/rateLimit.middleware';
import { z } from 'zod';

const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const router = Router();

const emailService = new EmailService();
const leadsService = new LeadsService(prisma, emailService);
const leadsController = new LeadsController(leadsService);

// Public route - contact form submission
router.post('/', contactRateLimit, validate(createLeadSchema), leadsController.create.bind(leadsController));

// Admin routes (protected)
router.get('/admin', authMiddleware, authorize('ADMIN'), leadsController.getAll.bind(leadsController));
router.get('/admin/:id', authMiddleware, authorize('ADMIN'), leadsController.getById.bind(leadsController));
router.patch('/admin/:id', authMiddleware, authorize('ADMIN'), leadsController.update.bind(leadsController));
router.delete('/admin/:id', authMiddleware, authorize('ADMIN'), leadsController.delete.bind(leadsController));

export default router;

