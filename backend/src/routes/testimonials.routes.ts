// routes/testimonials.routes.ts
import { Router } from 'express';
import { createTestimonialsController } from '../controllers/testimonials.controller';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();
const testimonialsController = createTestimonialsController(prisma);

// Public routes
router.get('/', cacheMiddleware(300), testimonialsController.getAll.bind(testimonialsController));

export default router;

// Admin routes are handled in admin.routes.ts

