// __tests__/integration/leads.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Leads Integration Tests', () => {
  let app: any;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    app = createApp();
    
    // Create test admin user
    const passwordHash = await bcrypt.hash('TestPassword123!@#', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: 'admin@test.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/leads', () => {
    it('should create a lead successfully', async () => {
      const response = await request(app)
        .post('/api/v1/leads')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/leads')
        .send({
          name: 'Test User',
          // Missing email and message
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/leads', () => {
    it('should get leads list with authentication', async () => {
      // Create a test lead
      await prisma.lead.create({
        data: {
          name: 'Test Lead',
          email: 'lead@example.com',
          message: 'Test message',
        },
      });

      const response = await request(app)
        .get('/api/v1/admin/leads')
        .set('Cookie', `access_token=${authToken}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/admin/leads');

      expect(response.status).toBe(401);
    });
  });
});

