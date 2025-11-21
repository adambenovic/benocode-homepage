// __tests__/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up test data if needed
});

// Add a dummy test to satisfy Jest
describe('Test Setup', () => {
  it('should have test environment configured', () => {
    expect(true).toBe(true);
  });
});
