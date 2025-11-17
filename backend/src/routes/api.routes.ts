// routes/api.routes.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import testimonialsRoutes from './testimonials.routes';
import leadsRoutes from './leads.routes';
import contentRoutes from './content.routes';
import legalRoutes from './legal.routes';
import socialLinksRoutes from './social-links.routes';
import externalLinksRoutes from './external-links.routes';
import meetingsRoutes from './meetings.routes';
import adminRoutes from './admin.routes';
import gdprRoutes from './gdpr.routes';
import uploadRoutes from './upload.routes';
import consentRoutes from './consent.routes';

const router = Router();

// API version prefix
router.use('/auth', authRoutes);

// Public routes
router.use('/testimonials', testimonialsRoutes);
router.use('/leads', leadsRoutes);
router.use('/content', contentRoutes);
router.use('/legal', legalRoutes);
router.use('/social-links', socialLinksRoutes);
router.use('/external-links', externalLinksRoutes);
router.use('/meetings', meetingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/consent', consentRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// GDPR routes
router.use('/gdpr', gdprRoutes);

  export default router;

