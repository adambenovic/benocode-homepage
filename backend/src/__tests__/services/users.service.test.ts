// __tests__/services/users.service.test.ts
import { UsersService } from '../../services/users.service';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { hashPassword } from '../../utils/password';

jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn(),
}));

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(() => Buffer.from('a'.repeat(48))),
    createHash: actual.createHash,
  };
});

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'ADMIN' as const,
  isActive: true,
  forcePasswordChange: false,
  inviteToken: null,
  inviteExpiresAt: null,
  passwordHash: 'hashed',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastLoginAt: null,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockEmailService = {
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
};

describe('UsersService', () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService(mockPrisma as any, mockEmailService as any);
    jest.clearAllMocks();
  });

  describe('create with password', () => {
    it('should create user, hash password, and set forcePasswordChange', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = { ...mockUser, forcePasswordChange: true, passwordHash: 'hashed-password' };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await usersService.create({
        email: 'test@example.com',
        role: 'ADMIN',
        method: 'password',
        password: 'StrongPass1!',
      });

      expect(hashPassword).toHaveBeenCalledWith('StrongPass1!');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'hashed-password',
            forcePasswordChange: true,
          }),
        })
      );
      expect(result.forcePasswordChange).toBe(true);
      expect(result.invitePending).toBe(false);
    });
  });

  describe('create with invite', () => {
    it('should create user, send invite email, and set invitePending', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const inviteUser = {
        ...mockUser,
        passwordHash: null,
        inviteToken: 'hashed-token',
        inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };
      mockPrisma.user.create.mockResolvedValue(inviteUser);

      const result = await usersService.create({
        email: 'test@example.com',
        role: 'EDITOR',
        method: 'invite',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inviteToken: expect.any(String),
            inviteExpiresAt: expect.any(Date),
          }),
        })
      );
      expect(mockEmailService.sendInviteEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );
      expect(result.invitePending).toBe(true);
    });
  });

  describe('create with duplicate email', () => {
    it('should throw ValidationError if email is taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.create({
          email: 'test@example.com',
          role: 'ADMIN',
          method: 'password',
          password: 'StrongPass1!',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getById', () => {
    it('should return user response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.getById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
      expect(result.invitePending).toBe(false);
    });
  });

  describe('getById not found', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.update('user-1', { email: 'new@example.com' }, 'other-user');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ email: 'new@example.com' }),
        })
      );
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('update self-deactivation', () => {
    it('should throw ValidationError when user tries to deactivate themselves', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.update('user-1', { isActive: false }, 'user-1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('update self role change', () => {
    it('should throw ValidationError when user tries to change their own role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.update('user-1', { role: 'EDITOR' }, 'user-1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const deactivatedUser = { ...mockUser, isActive: false };
      mockPrisma.user.update.mockResolvedValue(deactivatedUser);

      const result = await usersService.deactivate('user-1', 'other-user');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { isActive: false },
        })
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('deactivate self', () => {
    it('should throw ValidationError when user tries to deactivate themselves', async () => {
      await expect(usersService.deactivate('user-1', 'user-1')).rejects.toThrow(ValidationError);
    });
  });
});
