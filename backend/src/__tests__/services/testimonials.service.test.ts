// __tests__/services/testimonials.service.test.ts
import { TestimonialsService } from '../../services/testimonials.service';
import { PrismaClient } from '@prisma/client';

describe('TestimonialsService', () => {
  let testimonialsService: TestimonialsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      testimonial: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      testimonialTranslation: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    testimonialsService = new TestimonialsService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create testimonial with translations', async () => {
      const mockTestimonial = {
        id: '1',
        order: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [
          {
            id: '1',
            testimonialId: '1',
            locale: 'EN',
            name: 'John Doe',
            role: 'CEO',
            company: 'ACME Inc',
            content: 'Great service!',
          },
        ],
      };

      mockPrisma.testimonial.create.mockResolvedValue(mockTestimonial);

      const result = await testimonialsService.create({
        order: 0,
        isActive: true,
        translations: [
          {
            locale: 'EN',
            name: 'John Doe',
            role: 'CEO',
            company: 'ACME Inc',
            content: 'Great service!',
          },
        ],
      });

      expect(result).toHaveProperty('id');
      expect(result.isActive).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should return active testimonials', async () => {
      const mockTestimonials = [
        {
          id: '1',
          order: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          translations: [],
        },
      ];

      mockPrisma.testimonial.findMany.mockResolvedValue(mockTestimonials);

      const result = await testimonialsService.getAll('EN');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
