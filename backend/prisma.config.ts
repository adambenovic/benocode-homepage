// prisma.config.ts — Prisma 7 configuration
// Provides the database connection for `prisma migrate` and `prisma studio`.
// The runtime PrismaClient reads DATABASE_URL from this file via the adapter
// defined in src/config/database.ts.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    connectionString: process.env.DATABASE_URL!,
  },
});
