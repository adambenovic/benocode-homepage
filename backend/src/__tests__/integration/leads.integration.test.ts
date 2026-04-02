// __tests__/integration/leads.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import jwt from 'jsonwebtoken';

jest.mock('../../config/database', () => ({
  prisma: {
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendContactFormNotification: jest.fn().mockResolvedValue(undefined),
  })),
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

import { prisma } from '../../config/database';

const mockPrisma = prisma as any;
const JWT_SECRET = process.env.JWT_SECRET!;

function makeAdminToken() {
  return jwt.sign(
    { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const MOCK_LEAD = {
  id: 'lead-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  message: 'This is a test message with enough content.',
  status: 'NEW',
  source: 'contact_form',
  locale: 'EN',
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Leads API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/leads (public contact form)', () => {
    it('returns 201 on valid submission', async () => {
      mockPrisma.lead.create.mockResolvedValue(MOCK_LEAD);

      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message with enough content.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        id: MOCK_LEAD.id,
        name: MOCK_LEAD.name,
        email: MOCK_LEAD.email,
        status: 'NEW',
      });
    });

    it('returns 400 when name is too short', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({ name: 'A', email: 'test@example.com', message: 'Valid message content here.' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when message is too short', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({ name: 'Test User', email: 'test@example.com', message: 'Short' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({ name: 'Test User', email: 'not-an-email', message: 'Valid message content here.' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({});

      expect(res.status).toBe(400);
    });

    it('accepts optional phone field', async () => {
      mockPrisma.lead.create.mockResolvedValue({ ...MOCK_LEAD, phone: '+1234567890' });

      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          message: 'Test message with enough content to pass validation.',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/v1/leads/admin (protected)', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/leads/admin');
      expect(res.status).toBe(401);
    });

    it('returns 200 with leads list for admin', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([MOCK_LEAD]);
      mockPrisma.lead.count.mockResolvedValue(1);
      const token = makeAdminToken();

      const res = await request(app)
        .get('/api/v1/leads/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/leads/admin/:id (protected)', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/leads/admin/lead-1');
      expect(res.status).toBe(401);
    });

    it('returns 200 with lead data for admin', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);
      const token = makeAdminToken();

      const res = await request(app)
        .get('/api/v1/leads/admin/lead-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: 'lead-1' });
    });

    it('returns 404 when lead does not exist', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);
      const token = makeAdminToken();

      const res = await request(app)
        .get('/api/v1/leads/admin/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
