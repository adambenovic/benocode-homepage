const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('Admin123!@#', 12);
  await prisma.user.upsert({
    where: { email: 'admin@benocode.sk' },
    update: {},
    create: {
      email: 'admin@benocode.sk',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created successfully');
  await prisma.$disconnect();
})();
