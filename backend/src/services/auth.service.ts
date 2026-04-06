// services/auth.service.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { verifyPassword, hashPassword } from '../utils/password';
import { UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors';
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

    if (!user.isActive) {
      throw new UnauthorizedError();
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError();
    }

    const isValidPassword = await verifyPassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError();
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60,
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
        forcePasswordChange: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash!);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    });
  }

  async forceChangePassword(userId: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    });
  }

  async acceptInvite(rawToken: string, password: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await prisma.user.findFirst({
      where: { inviteToken: hashedToken },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired invite token');
    }

    if (!user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw new ValidationError('Invalid or expired invite token');
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpiresAt: null,
        forcePasswordChange: false,
      },
    });
  }

  private generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }
}
