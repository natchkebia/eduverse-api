import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.course.createMany({
    data: [
      {
        slug: 'frontend-development',
        titleKa: 'Frontend დეველოპერი',
        descriptionKa: 'ისწავლე React, Next.js და TypeScript ნულიდან.',
        altTextKa: 'ფრონტენდის კურსი',
        buttonKa: 'შეიძინე',
        formatKa: 'ონლაინ',
        languageKa: 'ქართული',
        titleEn: 'Frontend Development ',
        descriptionEn: 'Learn React, Next.js, and TypeScript from scratch.',
        altTextEn: 'Frontend Course',
        buttonEn: 'Buy Now',
        formatEn: 'Online',
        languageEn: 'English',
        originalPrice: 800,
        discountedPrice: 600,

        discount: '25%',
        imageUrl: '/images/educationPic.webp',
        isOnline: true,
        isGeorgia: true,
      },
      {
        slug: 'uiux-design',
        titleKa: 'UI/UX დიზაინი',
        descriptionKa: 'ისწავლე ფიგმა, პროტოტაირინგი და დიზაინის საფუძვლები.',
        altTextKa: 'დიზაინის კურსი',
        buttonKa: 'შეიძინე',
        formatKa: 'ადგილზე',
        languageKa: 'ქართული',
        titleEn: 'UI/UX Design',
        descriptionEn: 'Learn Figma, prototyping, and design fundamentals.',
        altTextEn: 'Design Course',
        buttonEn: 'Buy Now',
        formatEn: 'On-site',
        languageEn: 'English',
        originalPrice: 1000,
        discountedPrice: 600,

        discount: '30%',
        imageUrl: '/images/educationPic.webp',
        isOnline: false,
        isGeorgia: true,
      },
    ],
  });

  console.log('✅ Courses seeded successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
