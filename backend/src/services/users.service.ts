// services/users.service.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword } from '../utils/password';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateUserDto, UpdateUserDto, UserResponse, UserStatsResponse } from '../types/users.types';
import { EmailService } from './email.service';

export class UsersService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) {}

  async getAll(skip?: number, take?: number): Promise<{ data: UserResponse[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => this.mapToResponse(u)),
      total,
    };
  }

  async getStats(): Promise<UserStatsResponse> {
    const [total, admins, editors, active] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'EDITOR' } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      admins,
      editors,
      active,
      inactive: total - active,
    };
  }

  async getById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User');
    }

    return this.mapToResponse(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ValidationError('Email is already taken');
    }

    if (dto.method === 'password') {
      const passwordHash = await hashPassword(dto.password!);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          role: dto.role,
          passwordHash,
          forcePasswordChange: true,
        },
      });
      return this.mapToResponse(user);
    } else {
      // invite method
      const rawToken = crypto.randomBytes(48).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          role: dto.role,
          inviteToken: hashedToken,
          inviteExpiresAt,
        },
      });

      this.emailService.sendInviteEmail(dto.email, rawToken).catch(() => {
        // Error is logged in email service, just prevent unhandled rejection
      });

      return this.mapToResponse(user);
    }
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    if (id === currentUserId) {
      if (dto.isActive === false) {
        throw new ValidationError('You cannot deactivate your own account');
      }
      if (dto.role !== undefined && dto.role !== existing.role) {
        throw new ValidationError('You cannot change your own role');
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailTaken) {
        throw new ValidationError('Email is already taken');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.forcePasswordChange !== undefined) data.forcePasswordChange = dto.forcePasswordChange;
    if (dto.password !== undefined) {
      data.passwordHash = await hashPassword(dto.password);
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.mapToResponse(user);
  }

  async deactivate(id: string, currentUserId: string): Promise<UserResponse> {
    if (id === currentUserId) {
      throw new ValidationError('You cannot deactivate your own account');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return this.mapToResponse(user);
  }

  async resendInvite(id: string): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    if (existing.passwordHash !== null) {
      throw new ValidationError('User has already accepted the invite');
    }

    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await this.prisma.user.update({
      where: { id },
      data: { inviteToken: hashedToken, inviteExpiresAt },
    });

    this.emailService.sendInviteEmail(existing.email, rawToken).catch(() => {
      // Error is logged in email service, just prevent unhandled rejection
    });

    return this.mapToResponse(user);
  }

  private mapToResponse(user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    forcePasswordChange: boolean;
    inviteToken: string | null;
    inviteExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      forcePasswordChange: user.forcePasswordChange,
      invitePending: user.inviteToken !== null && user.inviteExpiresAt !== null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
