import { PrismaClient, $Enums } from '@prisma/client';

const prisma = new PrismaClient();
const { CourseType } = $Enums;

async function main() {
  await prisma.course.create({
    data: {
      type: CourseType.COURSE,
      slug: 'frontend-development',

      titleKa: 'Frontend დეველოპერი',
      titleEn: 'Frontend Development',

      descriptionKa: 'ისწავლე React, Next.js და TypeScript ნულიდან.',
      descriptionEn: 'Learn React, Next.js and TypeScript from scratch.',

      altTextKa: 'ფრონტენდის კურსი',
      altTextEn: 'Frontend Course',

      buttonKa: 'შეიძინე',
      buttonEn: 'Buy now',

      formatKa: 'ონლაინ',
      formatEn: 'Online',

      languageKa: 'ქართული',
      languageEn: 'Georgian',

      originalPrice: 800,
      discountedPrice: 600,
      discount: '25%',

      imageUrl: '/images/educationPic.webp',
      isOnline: true,
      isGeorgia: true,

      syllabusKa: 'HTML, CSS, JavaScript, React, Next.js, TypeScript',
      syllabusEn: 'HTML, CSS, JavaScript, React, Next.js, TypeScript',

      mentorKa: 'გიორგი ბაგრატიონი',
      mentorEn: 'George Bagrationi',

      videos: {
        create: [
          { url: 'https://youtube.com/embed/dQw4w9WgXcQ' },
          { url: 'https://youtube.com/embed/example2' },
        ],
      },

      materials: {
        create: [
          { link: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
          { link: 'https://react.dev' },
        ],
      },
    },
  });

  // -----------------------------
  // UI/UX DESIGN (COURSE)
  // -----------------------------
  await prisma.course.create({
    data: {
      type: CourseType.COURSE,
      slug: 'uiux-design',

      titleKa: 'UI/UX დიზაინი',
      titleEn: 'UI/UX Design',

      descriptionKa: 'ისწავლე ფიგმა, UX, პროტოტაირინგი და დიზაინის საფუძვლები.',
      descriptionEn: 'Learn Figma, UX, prototyping and design fundamentals.',

      altTextKa: 'დიზაინის კურსი',
      altTextEn: 'Design Course',

      buttonKa: 'შეიძინე',
      buttonEn: 'Buy now',

      formatKa: 'ადგილზე',
      formatEn: 'On-site',

      languageKa: 'ქართული',
      languageEn: 'Georgian',

      originalPrice: 1000,
      discountedPrice: 600,
      discount: '30%',

      imageUrl: '/images/educationPic.webp',
      isOnline: false,
      isGeorgia: true,

      syllabusKa: 'Figma, UX Research, Wireframing, Prototyping',
      syllabusEn: 'Figma, UX Research, Wireframing, Prototyping',

      mentorKa: 'ნინი შარაშენიძე',
      mentorEn: 'Nini Sharashenidze',

      videos: {
        create: [
          { url: 'https://youtube.com/embed/design1' },
          { url: 'https://youtube.com/embed/design2' },
        ],
      },

      materials: {
        create: [
          { link: 'https://figma.com' },
          { link: 'https://uxplanet.org' },
        ],
      },
    },
  });

  // -----------------------------
  // PHOTOSHOP WORKSHOP
  // -----------------------------
  await prisma.course.create({
    data: {
      type: CourseType.WORKSHOP,
      slug: 'photoshop-workshop',

      titleKa: 'ფოტოშოპის ვორკშოფი',
      titleEn: 'Photoshop Workshop',

      descriptionKa: 'ერთდღიანი ინტენსიური პრაქტიკული ვორკშოფი ფოტოშოპში.',
      descriptionEn: 'One-day intensive practical Photoshop workshop.',

      altTextKa: 'ვორკშოფი',
      altTextEn: 'Workshop',

      buttonKa: 'დაჯავშნა',
      buttonEn: 'Book now',

      formatKa: 'ადგილზე',
      formatEn: 'On-site',

      languageKa: 'ქართული',
      languageEn: 'Georgian',

      originalPrice: 150,
      discountedPrice: 120,
      discount: '20%',

      imageUrl: '/images/educationPic.webp',
      isOnline: false,
      isGeorgia: true,

      date: new Date('2025-01-20T18:00:00'),
      location: 'თბილისი, GMT Plaza',
    },
  });

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
