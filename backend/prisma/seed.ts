// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@benocode.sk';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}\n`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}\n`);
  }

  // Import legal documents if SEED_LEGAL=true or on first run (no legal pages exist)
  const shouldSeedLegal = process.env.SEED_LEGAL === 'true';
  const legalPagesCount = await prisma.legalPage.count();
  
  if (shouldSeedLegal || legalPagesCount === 0) {
    console.log('📄 Checking for legal documents...');
    
    const markdownPath = path.join(__dirname, '../docs/legal-documents.md');
    if (fs.existsSync(markdownPath)) {
      console.log('   Found legal-documents.md, importing...\n');
      
      try {
        // Import the legal documents script
        const { default: importLegalDocuments } = await import('../scripts/import-legal-docs');
        await importLegalDocuments();
      } catch (error) {
        console.error('⚠️  Failed to import legal documents:', error);
        console.log('   You can manually import them later with: npm run import:legal\n');
      }
    } else {
      console.log('   legal-documents.md not found, skipping legal import');
      console.log('   Run "npm run import:legal" to import legal documents manually\n');
    }
  } else {
    console.log('ℹ️  Legal documents already exist. To re-import, run: npm run import:legal\n');
  }

  console.log('✅ Seeding completed!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

