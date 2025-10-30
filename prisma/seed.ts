import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courses = [
    {
      title: 'Frontend Development',
      slug: 'Frontend Development',
      description: 'ისწავლე React, Next.js და TypeScript ნულიდან.',
      originalPrice: '800₾',
      discountedPrice: '600₾',
      discount: '25%',
      imageUrl: '/images/educationPic.webp',
      altText: 'Frontend Course',
      isOnline: true,
      isGeorgia: true,
      button: 'შეიძინე',
    },
    {
      title: 'Backend Development',
      slug: 'Backend Development',
      description:
        'ისწავლე Node.js, NestJS და PostgreSQL თანამედროვე არქიტექტურით.',
      originalPrice: '1000₾',
      discountedPrice: '800₾',
      discount: '20%',
      imageUrl: '/images/educationPic.webp',
      altText: 'Backend Course',
      isOnline: true,
      isGeorgia: false,
      button: 'შეიძინე',
    },
    {
      title: 'UI/UX Design',
      slug: 'UI/UX Design',
      description: 'ისწავლე ფიგმა, პროტოტიპირება და დიზაინის სისტემები.',
      originalPrice: '700₾',
      discountedPrice: '500₾',
      discount: '30%',
      imageUrl: '/images/educationPic.webp',
      altText: 'Design Course',
      isOnline: false,
      isGeorgia: true,
      button: 'შეიძინე',
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
  }

  console.log('✅ Courses updated/added successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());


