// services/__tests__/auth.service.test.ts
import { AuthService } from '../auth.service';
import { prisma } from '../../config/database';
import { verifyPassword } from '../../utils/password';
import { UnauthorizedError } from '../../utils/errors';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'ADMIN' as const,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
