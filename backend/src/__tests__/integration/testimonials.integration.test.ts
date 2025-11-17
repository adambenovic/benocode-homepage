// __tests__/integration/testimonials.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Testimonials Integration Tests', () => {
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
    await prisma.testimonial.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: 'admin@test.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/testimonials', () => {
    it('should get active testimonials', async () => {
      // Create test testimonial
      await prisma.testimonial.create({
        data: {
          isActive: true,
          order: 1,
          translations: {
            create: {
              locale: 'EN',
              name: 'Test User',
              content: 'Great service!',
            },
          },
        },
      });

      const response = await request(app).get('/api/v1/testimonials?locale=EN');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/admin/testimonials', () => {
    it('should create testimonial with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/testimonials')
        .set('Cookie', `access_token=${authToken}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          translations: [
            { locale: 'EN', name: 'John Doe', content: 'Excellent work!' },
          ],
          isActive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/testimonials')
        .send({
          translations: [{ locale: 'EN', name: 'Test', content: 'Test' }],
        });

      expect(response.status).toBe(401);
    });
  });
});

