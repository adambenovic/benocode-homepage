// __tests__/services/testimonials.service.test.ts
import { TestimonialsService } from '../../services/testimonials.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';

describe('TestimonialsService', () => {
  let testimonialsService: TestimonialsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      testimonial: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      testimonialTranslation: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    testimonialsService = new TestimonialsService(mockPrisma as any);
  });

  describe('getAll', () => {
    it('should return active testimonials for locale', async () => {
      const mockTestimonials = [
        {
          id: '1',
          isActive: true,
          displayOrder: 1,
          translations: [
            { locale: 'EN', author: 'John', content: 'Great service' },
          ],
        },
      ];

      mockPrisma.testimonial.findMany.mockResolvedValue(mockTestimonials);

      const result = await testimonialsService.getAll('EN');

      expect(result).toBeInstanceOf(Array);
      expect(mockPrisma.testimonial.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create testimonial with translations', async () => {
      const mockTestimonial = {
        id: '1',
        isActive: true,
        displayOrder: 1,
      };

      mockPrisma.testimonial.create.mockResolvedValue(mockTestimonial);
      mockPrisma.testimonialTranslation.createMany.mockResolvedValue({});

      await testimonialsService.create({
        translations: [
          { locale: 'EN', author: 'John', content: 'Great service' },
        ],
        isActive: true,
      });

      expect(mockPrisma.testimonial.create).toHaveBeenCalled();
      expect(mockPrisma.testimonialTranslation.createMany).toHaveBeenCalled();
    });

    it('should validate at least one translation', async () => {
      await expect(
        testimonialsService.create({
          translations: [],
          isActive: true,
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});

