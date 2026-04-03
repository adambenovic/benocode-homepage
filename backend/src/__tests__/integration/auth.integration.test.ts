// __tests__/integration/auth.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import jwt from 'jsonwebtoken';

// Mock database
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: jest.fn(),
  },
}));

// Mock password utilities
jest.mock('../../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendContactFormNotification: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Redis cache to avoid connection
jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn().mockResolvedValue(null),
  closeRedisClient: jest.fn().mockResolvedValue(undefined),
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { prisma } from '../../config/database';
import { verifyPassword } from '../../utils/password';

const mockPrisma = prisma as any;
const mockVerifyPassword = verifyPassword as jest.Mock;

const MOCK_USER = {
  id: 'user-1',
  email: 'admin@example.com',
  passwordHash: 'hashed-password',
  role: 'ADMIN' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

const JWT_SECRET = process.env.JWT_SECRET!;

function makeAccessToken(userId = MOCK_USER.id, role = 'ADMIN') {
  return jwt.sign({ userId, email: MOCK_USER.email, role }, JWT_SECRET, { expiresIn: '7d' });
}

describe('Auth API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.user.update.mockResolvedValue(MOCK_USER);
      mockVerifyPassword.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'ValidPass1!' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        user: { id: MOCK_USER.id, email: MOCK_USER.email, role: 'ADMIN' },
      });
    });

    it('returns 401 for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
      mockVerifyPassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'somepassword' });

      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'password' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('returns 200 and clears auth cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      // Cookies should be cleared (Set-Cookie headers present)
      const setCookieHeader = res.headers['set-cookie'] as string[] | string | undefined;
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        const hasExpiredCookie = cookies.some(
          (c) => c.includes('access_token') && c.includes('Expires=Thu, 01 Jan 1970')
        );
        expect(hasExpiredCookie).toBe(true);
      }
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 200 with user data when authenticated', async () => {
      const token = makeAccessToken();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
        createdAt: MOCK_USER.createdAt,
        lastLoginAt: MOCK_USER.lastLoginAt,
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        role: 'ADMIN',
      });
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  describe('Health check', () => {
    it('GET /health returns 200', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });
  });
});
