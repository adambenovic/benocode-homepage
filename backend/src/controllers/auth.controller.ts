// controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { LoginDto } from '../types/auth.types';

export class AuthController {
  constructor(private authService: AuthService) { }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: LoginDto = req.body;
      const result = await this.authService.login(dto);

      // Set httpOnly cookies for tokens
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }
      const user = await this.authService.getCurrentUser(req.user.userId);
      res.json({ data: user });
    } catch (error) {
      return next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // Clear httpOnly cookies
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({ data: { message: 'Logged out successfully' } });
    } catch (error) {
      return next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({ data: { message: 'Password changed successfully' } });
    } catch (error) {
      return next(error);
    }
  }

  async forceChangePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }
      const { newPassword } = req.body;
      await this.authService.forceChangePassword(req.user.userId, newPassword);

      // Issue new tokens with forcePasswordChange: false
      const user = await this.authService.getCurrentUser(req.user.userId);
      const jwt = require('jsonwebtoken');
      const { env } = require('../config/env');
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: false,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
      const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ data: { message: 'Password changed successfully' } });
    } catch (error) {
      return next(error);
    }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await this.authService.acceptInvite(token, password);
      res.json({ data: { message: 'Password set successfully. You can now log in.' } });
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get refresh token from cookie first, then body
      const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          error: {
            message: 'Refresh token is required',
            statusCode: 400,
          },
        });
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Update httpOnly cookies
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ data: result });
    } catch (error) {
      return next(error);
    }
  }
}

