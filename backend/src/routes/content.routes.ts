// routes/content.routes.ts
import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { ContentService } from '../services/content.service';
import { prisma } from '../config/database';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

const contentService = new ContentService(prisma);
const contentController = new ContentController(contentService);

// Public routes
router.get('/', cacheMiddleware(300), contentController.getAll.bind(contentController));
router.get('/:key', cacheMiddleware(600), contentController.getByKey.bind(contentController));

export default router;

