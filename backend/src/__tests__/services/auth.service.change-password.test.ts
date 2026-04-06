// __tests__/services/auth.service.change-password.test.ts
import { AuthService } from '../../services/auth.service';
import { prisma } from '../../config/database';
import { verifyPassword, hashPassword } from '../../utils/password';
import { UnauthorizedError, ValidationError } from '../../utils/errors';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('new-hashed-password'),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(),
  },
}));

describe('AuthService — changePassword / forceChangePassword / acceptInvite / login guards', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  // ─── changePassword ────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should verify current password, hash new password, and clear forcePasswordChange', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, forcePasswordChange: false });

      await authService.changePassword('user-1', 'current-password', 'new-password');

      expect(verifyPassword).toHaveBeenCalledWith('current-password', 'old-hashed-password');
      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-password', forcePasswordChange: false },
      });
    });

    it('should throw ValidationError when current password is incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', 'wrong-password', 'new-password')
      ).rejects.toThrow(ValidationError);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── forceChangePassword ───────────────────────────────────────────────────

  describe('forceChangePassword', () => {
    it('should hash the new password and clear forcePasswordChange without verifying current', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, forcePasswordChange: false });

      const result = await authService.forceChangePassword('user-1', 'new-password');

      expect(verifyPassword).not.toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-password', forcePasswordChange: false },
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.forcePasswordChange).toBe(false);
    });

    it('should throw ValidationError when forcePasswordChange is false', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.forceChangePassword('user-1', 'new-password')
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─── acceptInvite ──────────────────────────────────────────────────────────

  describe('acceptInvite', () => {
    it('should find user by hashed token, set password, and clear invite fields', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockUser = {
        id: 'user-1',
        email: 'invited@example.com',
        passwordHash: null,
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: true,
        inviteToken: 'hashed-token-value',
        inviteExpiresAt: futureDate,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: 'new-hashed-password' });

      await authService.acceptInvite('raw-token', 'my-new-password');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({ inviteToken: expect.any(String) }),
      });
      expect(hashPassword).toHaveBeenCalledWith('my-new-password');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'new-hashed-password',
          inviteToken: null,
          inviteExpiresAt: null,
          forcePasswordChange: false,
        },
      });
    });

    it('should throw ValidationError when invite token is expired', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const mockUser = {
        id: 'user-1',
        email: 'invited@example.com',
        passwordHash: null,
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: true,
        inviteToken: 'hashed-token-value',
        inviteExpiresAt: pastDate,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.acceptInvite('raw-token', 'my-new-password')).rejects.toThrow(ValidationError);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when invite token is not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.acceptInvite('invalid-token', 'my-new-password')).rejects.toThrow(ValidationError);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── login guards ──────────────────────────────────────────────────────────

  describe('login — isActive and passwordHash guards', () => {
    it('should throw UnauthorizedError when user is deactivated (isActive=false)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'deactivated@example.com',
        passwordHash: 'hashed-password',
        role: 'ADMIN' as const,
        isActive: false,
        forcePasswordChange: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'deactivated@example.com', password: 'password' })
      ).rejects.toThrow(UnauthorizedError);

      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when invite is pending (passwordHash=null)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'invited@example.com',
        passwordHash: null,
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'invited@example.com', password: 'password' })
      ).rejects.toThrow(UnauthorizedError);

      expect(verifyPassword).not.toHaveBeenCalled();
    });
  });
});
