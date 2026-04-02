// prisma.config.ts — Prisma 7 configuration
// Provides the database connection for prisma CLI commands (db push, studio, etc.).
// The runtime PrismaClient uses the PrismaPg adapter in src/config/database.ts.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
