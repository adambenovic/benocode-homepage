// __tests__/integration/testimonials.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';

jest.mock('../../config/database', () => ({
  prisma: {
    testimonial: {
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

const MOCK_TESTIMONIAL = {
  id: 'testimonial-1',
  isActive: true,
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  translations: [
    {
      id: 'trans-1',
      testimonialId: 'testimonial-1',
      locale: 'EN',
      name: 'John Doe',
      content: 'Great service!',
      company: 'Acme Corp',
      role: 'CTO',
    },
  ],
};

describe('Testimonials API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/testimonials (public)', () => {
    it('returns 200 with testimonials array', async () => {
      mockPrisma.testimonial.findMany.mockResolvedValue([MOCK_TESTIMONIAL]);

      const res = await request(app).get('/api/v1/testimonials');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0]).toMatchObject({
        id: 'testimonial-1',
        isActive: true,
      });
    });

    it('returns 200 with empty array when no testimonials', async () => {
      mockPrisma.testimonial.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/v1/testimonials');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns correct content-type', async () => {
      mockPrisma.testimonial.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/v1/testimonials');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('accepts locale query filter', async () => {
      mockPrisma.testimonial.findMany.mockResolvedValue([MOCK_TESTIMONIAL]);

      const res = await request(app).get('/api/v1/testimonials?locale=EN');

      expect(res.status).toBe(200);
    });
  });

  describe('Security headers', () => {
    it('responses include security headers from helmet', async () => {
      mockPrisma.testimonial.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/v1/testimonials');

      // Helmet adds these headers
      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('404 for unknown routes', () => {
    it('returns 404 for unknown API path', async () => {
      const res = await request(app).get('/api/v1/nonexistent-route');
      // Express returns 404 by default for unknown routes
      expect(res.status).toBe(404);
    });
  });
});
