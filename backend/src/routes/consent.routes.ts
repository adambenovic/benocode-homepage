// routes/consent.routes.ts
import { Router } from 'express';
import { ConsentService } from '../services/consent.service';
import { prisma } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const consentService = new ConsentService(prisma);

const recordConsentSchema = z.object({
  email: z.string().email().optional(),
  consent: z.boolean(),
});

/**
 * Record cookie consent (public endpoint)
 * POST /api/v1/consent
 */
router.post('/', validate(recordConsentSchema), async (req: any, res, next) => {
  try {
    const userId = req.user?.userId; // Optional - may be anonymous
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await consentService.recordConsent({
      userId,
      email: req.body.email,
      consent: req.body.consent,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    });

    res.json({ data: { message: 'Consent recorded successfully' } });
  } catch (error) {
    next(error);
  }
});

/**
 * Get consent history (authenticated users only)
 * GET /api/v1/consent/history
 */
router.get('/history', authMiddleware, async (req: any, res, next) => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;

    const history = await consentService.getConsentHistory(userId, email);

    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

export default router;

