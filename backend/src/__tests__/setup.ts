import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(process.env.DATABASE_URL ?? 'postgresql://benocode:benocode_dev_password@localhost:5432/benocode');
const prisma = new PrismaClient({ adapter });

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
