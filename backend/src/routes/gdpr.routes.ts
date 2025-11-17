// routes/gdpr.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { Request, Response } from 'express';

const router = Router();

/**
 * Export user data (GDPR compliance)
 * GET /api/v1/gdpr/export
 */
router.get('/export', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
    }

    // Collect all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Get user's leads
    const leads = await prisma.lead.findMany({
      where: { email: user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        source: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get user's meetings
    const meetings = await prisma.meeting.findMany({
      where: { email: user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        scheduledAt: true,
        duration: true,
        timezone: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const exportData = {
      user,
      leads,
      meetings,
      exportedAt: new Date().toISOString(),
    };

    res.json({ data: exportData });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to export data', statusCode: 500 } });
  }
});

/**
 * Delete user data (GDPR compliance)
 * DELETE /api/v1/gdpr/delete
 */
router.delete('/delete', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Delete user's leads
    await prisma.lead.deleteMany({
      where: { email: user.email },
    });

    // Delete user's meetings
    await prisma.meeting.deleteMany({
      where: { email: user.email },
    });

    // Note: We don't delete the user account itself, just anonymize it
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.local`,
        passwordHash: '', // Clear password
      },
    });

    res.json({ data: { message: 'Data deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to delete data', statusCode: 500 } });
  }
});

export default router;

