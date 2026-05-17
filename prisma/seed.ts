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

async function upsertPrivilegedUser(
  tx: PrismaClient,
  options: {
    emailEnv: string;
    passwordEnv: string;
    nameEnv: string;
    surnameEnv: string;
    fallbackName: string;
    role: Role;
    label: string;
  },
) {
  const adminEmail = process.env[options.emailEnv];
  const adminPassword = process.env[options.passwordEnv];

  if (!adminEmail || !adminPassword) {
    console.log(
      `ℹ️ ${options.emailEnv} / ${options.passwordEnv} not set — skipping ${options.label} seed.`,
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await tx.user.upsert({
    where: { email: adminEmail },
    update: { role: options.role, verified: true, password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: process.env[options.nameEnv] || options.fallbackName,
      surname: process.env[options.surnameEnv] || null,
      role: options.role,
      verified: true,
    },
  });

  console.log(`✅ ${options.label} upserted`);
}

async function upsertSuperAdmin(tx: PrismaClient) {
  return upsertPrivilegedUser(tx, {
    emailEnv: 'SUPER_ADMIN_EMAIL',
    passwordEnv: 'SUPER_ADMIN_PASSWORD',
    nameEnv: 'SUPER_ADMIN_NAME',
    surnameEnv: 'SUPER_ADMIN_SURNAME',
    fallbackName: 'Super Admin',
    role: Role.SUPER_ADMIN,
    label: 'Super admin',
  });
}

async function upsertAdmin(tx: PrismaClient) {
  return upsertPrivilegedUser(tx, {
    emailEnv: 'ADMIN_EMAIL',
    passwordEnv: 'ADMIN_PASSWORD',
    nameEnv: 'ADMIN_NAME',
    surnameEnv: 'ADMIN_SURNAME',
    fallbackName: 'Admin',
    role: Role.ADMIN,
    label: 'Admin',
  });
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
    update: { role: Role.USER, verified: true, password: hashedPassword },
    create: {
      email: studentEmail,
      password: hashedPassword,
      name: 'Test',
      surname: 'Student',
      role: Role.USER,
      verified: true,
    },
  });

  console.log('✅ Fake student upserted');
}

async function main() {
  assertSeedAllowed();

  await prisma.$transaction(async (tx) => {
    await upsertSuperAdmin(tx as any);
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
