// routes/meetings.routes.ts
import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { MeetingsService } from '../services/meetings.service';
import { EmailService } from '../services/email.service';
import { prisma } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { createMeetingSchema } from '../types/meetings.types';

const router = Router();

const emailService = new EmailService();
const meetingsService = new MeetingsService(prisma, emailService);
const meetingsController = new MeetingsController(meetingsService);

// Public routes
router.post('/', validate(createMeetingSchema), meetingsController.create.bind(meetingsController));
router.get('/availability', meetingsController.getAvailability.bind(meetingsController));

export default router;

