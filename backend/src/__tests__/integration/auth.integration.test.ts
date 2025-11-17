// __tests__/integration/auth.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@',
        },
      },
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create test user
      const passwordHash = await bcrypt.hash('TestPassword123!@#', 12);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash,
          role: 'ADMIN',
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!@#',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Create test user and get refresh token
      const passwordHash = await bcrypt.hash('TestPassword123!@#', 12);
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash,
          role: 'ADMIN',
        },
      });

      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!@#',
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });
  });
});

