// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Password validation function
function validatePasswordStrength(password) {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }
}

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@benocode.sk';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  // Validate password strength
  try {
    validatePasswordStrength(adminPassword);
  } catch (error) {
    console.error('Password validation failed:', error.message);
    console.error('Please set ADMIN_PASSWORD environment variable with a strong password');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create default meeting availability (Monday-Friday, 9 AM - 5 PM)
  const existingAvailability = await prisma.meetingAvailability.findFirst();
  if (!existingAvailability) {
    const availability = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true }, // Friday
    ];

    await prisma.meetingAvailability.createMany({
      data: availability,
    });
    console.log('Default meeting availability created');
  } else {
    console.log('Meeting availability already exists');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

