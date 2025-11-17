// routes/upload.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { AppError } from '../utils/errors';

const router = Router();

// File upload endpoint (admin only)
router.post(
  '/',
  authMiddleware,
  authorize('ADMIN'),
  uploadSingle,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      res.json({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: `/uploads/${req.file.filename}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

