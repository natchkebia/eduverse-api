import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function assertSeedAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Seeding is disabled in production.');
  }
  if (process.env.ALLOW_SEED !== 'true') {
    throw new Error('❌ Set ALLOW_SEED=true to run seed.');
  }
}

async function upsertAdmin(tx: PrismaClient) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('ℹ️ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await tx.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, verified: true, password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: process.env.ADMIN_NAME || 'Admin',
      surname: process.env.ADMIN_SURNAME || null,
      role: Role.ADMIN,
      verified: true,
    },
  });

  console.log('✅ Admin upserted');
}

async function upsertFakeStudent(tx: PrismaClient) {
  const studentEmail = process.env.SEED_STUDENT_EMAIL;
  const studentPassword = process.env.SEED_STUDENT_PASSWORD;

  if (!studentEmail || !studentPassword) {
    console.log('ℹ️ SEED_STUDENT_EMAIL / SEED_STUDENT_PASSWORD not set — skipping fake student.');
    return;
  }

  const hashedPassword = await bcrypt.hash(studentPassword, 10);

  await tx.user.upsert({
    where: { email: studentEmail },
    update: { role: Role.STUDENT, verified: true, password: hashedPassword },
    create: {
      email: studentEmail,
      password: hashedPassword,
      name: 'Test',
      surname: 'Student',
      role: Role.STUDENT,
      verified: true,
    },
  });

  console.log('✅ Fake student upserted');
}

async function main() {
  assertSeedAllowed();

  await prisma.$transaction(async (tx) => {
    await upsertAdmin(tx as any);
    await upsertFakeStudent(tx as any);
  });

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((err) => console.error('❌ Seed failed:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
