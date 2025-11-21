// services/auth.service.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { LoginDto, LoginResponse, JwtPayload } from '../types/auth.types';

export class AuthService {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    const isValidPassword = await verifyPassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError();
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedError();
      }

      // Generate new tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      };
    } catch (error) {
      throw new UnauthorizedError();
    }
  }

  async getCurrentUser(userId: string) {
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

    return user;
  }

  private generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '30d', // Refresh token lasts 30 days
    });
  }
}

