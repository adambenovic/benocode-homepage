// __tests__/integration/content.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Content Integration Tests', () => {
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
    await prisma.content.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: 'admin@test.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/content', () => {
    it('should get content list', async () => {
      const response = await request(app).get('/api/v1/content');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/content/:key', () => {
    it('should get content by key', async () => {
      // Create test content
      const content = await prisma.content.create({
        data: {
          key: 'test.key',
          type: 'TEXT',
          translations: {
            create: {
              locale: 'EN',
              value: 'Test value',
            },
          },
        },
      });

      const response = await request(app).get('/api/v1/content/test.key?locale=EN');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('key', 'test.key');
    });
  });

  describe('POST /api/v1/admin/content', () => {
    it('should create content with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/content')
        .set('Cookie', `access_token=${authToken}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'new.key',
          type: 'TEXT',
          translations: [
            { locale: 'EN', value: 'New content' },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('key', 'new.key');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/content')
        .send({
          key: 'unauthorized.key',
          type: 'TEXT',
        });

      expect(response.status).toBe(401);
    });
  });
});

