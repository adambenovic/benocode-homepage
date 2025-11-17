// routes/admin.routes.ts
import { Router } from 'express';
import { createTestimonialsController } from '../controllers/testimonials.controller';
import { LeadsController } from '../controllers/leads.controller';
import { LeadsService } from '../services/leads.service';
import { EmailService } from '../services/email.service';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationMiddleware } from '../middleware/pagination.middleware';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  updateOrderSchema,
} from '../types/testimonials.types';
import { z } from 'zod';
import { ContentController } from '../controllers/content.controller';
import { ContentService } from '../services/content.service';
import {
  createContentSchema,
  updateContentSchema,
} from '../types/content.types';
import { LegalController } from '../controllers/legal.controller';
import { LegalService } from '../services/legal.service';
import {
  createLegalPageSchema,
  updateLegalPageSchema,
} from '../types/legal.types';
import { LinksController } from '../controllers/links.controller';
import { LinksService } from '../services/links.service';
import {
  createSocialLinkSchema,
  updateSocialLinkSchema,
  createExternalLinkSchema,
  updateExternalLinkSchema,
} from '../types/links.types';
import { MeetingsController } from '../controllers/meetings.controller';
import { MeetingsService } from '../services/meetings.service';
import {
  updateMeetingSchema,
  updateAvailabilitySchema,
} from '../types/meetings.types';
import { getMetrics } from '../middleware/metrics.middleware';

const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED']).optional(),
});

const router = Router();

// Content admin routes
const contentService = new ContentService(prisma);
const contentController = new ContentController(contentService);
router.get('/content', authMiddleware, authorize('ADMIN'), paginationMiddleware, contentController.getAll.bind(contentController));
router.post('/content', authMiddleware, authorize('ADMIN'), validate(createContentSchema), contentController.create.bind(contentController));
router.put('/content/:key', authMiddleware, authorize('ADMIN'), validate(updateContentSchema), contentController.update.bind(contentController));

// Testimonials admin routes
const testimonialsController = createTestimonialsController(prisma);
router.get('/testimonials', authMiddleware, authorize('ADMIN'), paginationMiddleware, testimonialsController.getAllAdmin.bind(testimonialsController));
router.post('/testimonials', authMiddleware, authorize('ADMIN'), validate(createTestimonialSchema), testimonialsController.create.bind(testimonialsController));
router.get('/testimonials/:id', authMiddleware, authorize('ADMIN'), testimonialsController.getById.bind(testimonialsController));
router.put('/testimonials/:id', authMiddleware, authorize('ADMIN'), validate(updateTestimonialSchema), testimonialsController.update.bind(testimonialsController));
router.delete('/testimonials/:id', authMiddleware, authorize('ADMIN'), testimonialsController.delete.bind(testimonialsController));
router.patch('/testimonials/:id/order', authMiddleware, authorize('ADMIN'), validate(updateOrderSchema), testimonialsController.updateOrder.bind(testimonialsController));

// Leads admin routes
const emailService = new EmailService();
const leadsService = new LeadsService(prisma, emailService);
const leadsController = new LeadsController(leadsService);
router.get('/leads', authMiddleware, authorize('ADMIN'), paginationMiddleware, leadsController.getAll.bind(leadsController));
router.get('/leads/export', authMiddleware, authorize('ADMIN'), leadsController.export.bind(leadsController));
router.get('/leads/:id', authMiddleware, authorize('ADMIN'), leadsController.getById.bind(leadsController));
router.patch('/leads/:id', authMiddleware, authorize('ADMIN'), validate(updateLeadSchema), leadsController.update.bind(leadsController));
router.delete('/leads/:id', authMiddleware, authorize('ADMIN'), leadsController.delete.bind(leadsController));

// Legal Pages admin routes
const legalService = new LegalService(prisma);
const legalController = new LegalController(legalService);
router.get('/legal-pages', authMiddleware, authorize('ADMIN'), legalController.getAll.bind(legalController));
router.put('/legal-pages/:slug', authMiddleware, authorize('ADMIN'), validate(updateLegalPageSchema), legalController.update.bind(legalController));

// Social Links admin routes
const linksService = new LinksService(prisma);
const linksController = new LinksController(linksService);
router.get('/social-links', authMiddleware, authorize('ADMIN'), linksController.getAllSocialLinksAdmin.bind(linksController));
router.post('/social-links', authMiddleware, authorize('ADMIN'), validate(createSocialLinkSchema), linksController.createSocialLink.bind(linksController));
router.put('/social-links/:id', authMiddleware, authorize('ADMIN'), validate(updateSocialLinkSchema), linksController.updateSocialLink.bind(linksController));
router.delete('/social-links/:id', authMiddleware, authorize('ADMIN'), linksController.deleteSocialLink.bind(linksController));

// External Links admin routes
router.get('/external-links', authMiddleware, authorize('ADMIN'), linksController.getAllExternalLinksAdmin.bind(linksController));
router.post('/external-links', authMiddleware, authorize('ADMIN'), validate(createExternalLinkSchema), linksController.createExternalLink.bind(linksController));
router.put('/external-links/:id', authMiddleware, authorize('ADMIN'), validate(updateExternalLinkSchema), linksController.updateExternalLink.bind(linksController));
router.delete('/external-links/:id', authMiddleware, authorize('ADMIN'), linksController.deleteExternalLink.bind(linksController));

// Meetings admin routes
const meetingsService = new MeetingsService(prisma, emailService);
const meetingsController = new MeetingsController(meetingsService);
router.get('/meetings', authMiddleware, authorize('ADMIN'), paginationMiddleware, meetingsController.getAll.bind(meetingsController));
router.get('/meetings/availability', authMiddleware, authorize('ADMIN'), meetingsController.getAvailabilityConfig.bind(meetingsController));
router.put('/meetings/availability', authMiddleware, authorize('ADMIN'), validate(updateAvailabilitySchema), meetingsController.updateAvailability.bind(meetingsController));
router.get('/meetings/:id', authMiddleware, authorize('ADMIN'), meetingsController.getById.bind(meetingsController));
router.patch('/meetings/:id', authMiddleware, authorize('ADMIN'), validate(updateMeetingSchema), meetingsController.update.bind(meetingsController));
router.delete('/meetings/:id', authMiddleware, authorize('ADMIN'), meetingsController.delete.bind(meetingsController));

// Metrics endpoint
router.get('/metrics', authMiddleware, authorize('ADMIN'), (req, res) => {
  res.json({ data: getMetrics() });
});

export default router;

