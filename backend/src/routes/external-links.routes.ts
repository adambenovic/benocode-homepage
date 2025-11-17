// routes/external-links.routes.ts
import { Router } from 'express';
import { LinksController } from '../controllers/links.controller';
import { LinksService } from '../services/links.service';
import { prisma } from '../config/database';

const router = Router();

const linksService = new LinksService(prisma);
const linksController = new LinksController(linksService);

// Public route
router.get('/', linksController.getAllExternalLinks.bind(linksController));

export default router;

