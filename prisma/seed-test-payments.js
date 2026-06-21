/* eslint-disable */
// One-off seed for testing the Flitt payment flow.
// Run: node prisma/seed-test-payments.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const IMG = '/images/educationPic.webp';

const courses = [
  {
    slug: 'test-payment-course-1gel',
    titleKa: 'ტესტ კურსი — 1₾',
    descriptionKa: 'გადახდის ტესტისთვის — ყველაზე იაფი (1 ლარი).',
    originalPrice: 1,
  },
  {
    slug: 'test-payment-course-web',
    titleKa: 'ვებ დეველოპმენტი (ტესტი)',
    descriptionKa: 'HTML, CSS, JavaScript — სატესტო ფასიანი კურსი.',
    originalPrice: 50,
    discountedPrice: 35,
  },
  {
    slug: 'test-payment-course-design',
    titleKa: 'UI/UX დიზაინი (ტესტი)',
    descriptionKa: 'Figma და დიზაინის საფუძვლები — სატესტო კურსი.',
    originalPrice: 80,
  },
];

async function main() {
  // ── test courses ──────────────────────────────────────────────
  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        originalPrice: c.originalPrice,
        discountedPrice: c.discountedPrice ?? null,
        contentLocale: 'ka',
        status: 'ACTIVE',
      },
      create: {
        slug: c.slug,
        type: 'COURSE',
        teachingLanguage: 'KA',
        contentLocale: 'ka',
        category: 'TECHNOLOGY',
        delivery: 'VIDEO',
        format: 'ONLINE',
        originalPrice: c.originalPrice,
        discountedPrice: c.discountedPrice ?? null,
        imageUrl: IMG,
        titleKa: c.titleKa,
        descriptionKa: c.descriptionKa,
        syllabusKa: 'სატესტო სილაბუსი.',
        maxStudents: 1000,
        status: 'ACTIVE',
      },
    });
    console.log(`course: ${course.slug} (id=${course.id}, price=${course.discountedPrice ?? course.originalPrice}₾)`);
  }

  // ── teacher user + pending subscription ───────────────────────
  const email = 'teacher@eduverse.dev';
  const password = 'Teacher123!';
  const hashed = await bcrypt.hash(password, 10);

  const teacher = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      name: 'ტესტ',
      surname: 'მასწავლებელი',
      role: 'USER',
      verified: true,
    },
  });

  await prisma.teacherSubscription.upsert({
    where: { userId: teacher.id },
    update: { status: 'PENDING_PAYMENT' },
    create: { userId: teacher.id, status: 'PENDING_PAYMENT', monthlyFee: 30 },
  });

  console.log(`teacher: ${email} / ${password} (id=${teacher.id}) — subscription PENDING_PAYMENT`);
  console.log('done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
