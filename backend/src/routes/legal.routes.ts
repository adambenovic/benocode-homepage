// routes/legal.routes.ts
import { Router } from 'express';
import { LegalController } from '../controllers/legal.controller';
import { LegalService } from '../services/legal.service';
import { prisma } from '../config/database';

const router = Router();

const legalService = new LegalService(prisma);
const legalController = new LegalController(legalService);

// Public routes
router.get('/:slug', legalController.getBySlug.bind(legalController));

export default router;

