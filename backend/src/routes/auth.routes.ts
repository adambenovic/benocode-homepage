// routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';
import { changePasswordSchema, acceptInviteSchema, forceChangePasswordSchema } from '../types/users.types';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

router.post('/login', authRateLimit, validate(loginSchema), authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh', authRateLimit, validate(refreshTokenSchema), authController.refresh.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));

router.post(
  '/change-password',
  authRateLimit,
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

router.post(
  '/force-change-password',
  authRateLimit,
  authMiddleware,
  validate(forceChangePasswordSchema),
  authController.forceChangePassword.bind(authController)
);

router.post(
  '/accept-invite',
  authRateLimit,
  validate(acceptInviteSchema),
  authController.acceptInvite.bind(authController)
);

export default router;

