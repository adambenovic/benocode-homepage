// services/__tests__/auth.service.test.ts
import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';
import * as passwordUtils from '../../utils/password';

// Mock dependencies
jest.mock('../../utils/password');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    authService = new AuthService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError if password is incorrect', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        ValidationError
      );
    });

    it('should return tokens and user on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('test@example.com', 'correctpassword');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});

