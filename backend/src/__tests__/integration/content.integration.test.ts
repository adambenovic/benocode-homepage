// __tests__/integration/content.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import jwt from 'jsonwebtoken';

jest.mock('../../config/database', () => ({
  prisma: {
    content: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn().mockResolvedValue(null),
  closeRedisClient: jest.fn().mockResolvedValue(undefined),
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({})),
}));

import { prisma } from '../../config/database';

const mockPrisma = prisma as any;
const JWT_SECRET = process.env.JWT_SECRET!;

const MOCK_CONTENT = {
  id: 'content-1',
  key: 'hero-title',
  type: 'TEXT',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  translations: [
    { id: 'trans-1', contentId: 'content-1', locale: 'EN', value: 'Welcome to BenoCode' },
    { id: 'trans-2', contentId: 'content-1', locale: 'SK', value: 'Vitajte v BenoCode' },
  ],
};

describe('Content API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/content (public)', () => {
    it('returns 200 with content array', async () => {
      mockPrisma.content.findMany.mockResolvedValue([MOCK_CONTENT]);
      mockPrisma.content.count.mockResolvedValue(1);

      const res = await request(app).get('/api/v1/content');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0]).toMatchObject({
        key: 'hero-title',
        type: 'TEXT',
      });
    });

    it('returns 200 with empty array when no content', async () => {
      mockPrisma.content.findMany.mockResolvedValue([]);
      mockPrisma.content.count.mockResolvedValue(0);

      const res = await request(app).get('/api/v1/content');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('filters by locale query param', async () => {
      mockPrisma.content.findMany.mockResolvedValue([MOCK_CONTENT]);
      mockPrisma.content.count.mockResolvedValue(1);

      const res = await request(app).get('/api/v1/content?locale=EN');

      expect(res.status).toBe(200);
      expect(mockPrisma.content.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/content/:key (public)', () => {
    it('returns 200 with content for existing key', async () => {
      mockPrisma.content.findUnique.mockResolvedValue(MOCK_CONTENT);

      const res = await request(app).get('/api/v1/content/hero-title');

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ key: 'hero-title' });
    });

    it('returns 404 for unknown key', async () => {
      mockPrisma.content.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/v1/content/nonexistent-key');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/admin/content (protected)', () => {
    // The CSRF middleware runs before auth middleware, so any POST to /admin
    // without a CSRF token returns 403 regardless of authentication state.
    it('returns 403 without CSRF token (unauthenticated)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content')
        .send({ key: 'new-key', type: 'TEXT', translations: [] });

      expect(res.status).toBe(403);
    });

    it('returns 403 without CSRF token even when authenticated', async () => {
      const token = jwt.sign(
        { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${token}`)
        .send({ key: 'new-key', type: 'TEXT', translations: [] });

      expect(res.status).toBe(403);
    });
  });

  describe('Response structure', () => {
    it('content list response has correct shape', async () => {
      mockPrisma.content.findMany.mockResolvedValue([MOCK_CONTENT]);
      mockPrisma.content.count.mockResolvedValue(1);

      const res = await request(app).get('/api/v1/content');

      expect(res.body).toHaveProperty('data');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
