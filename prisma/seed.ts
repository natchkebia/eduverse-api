import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 🔹 Frontend Development
  const frontendCourse = await prisma.course.create({
    data: {
      slug: "frontend-development",
      titleKa: "Frontend დეველოპერი",
      descriptionKa: "ისწავლე React, Next.js და TypeScript ნულიდან.",
      altTextKa: "ფრონტენდის კურსი",
      buttonKa: "შეიძინე",
      formatKa: "ონლაინ",
      languageKa: "ქართული",
      titleEn: "Frontend Development",
      descriptionEn: "Learn React, Next.js, and TypeScript from scratch.",
      altTextEn: "Frontend Course",
      buttonEn: "Buy Now",
      formatEn: "Online",
      languageEn: "English",
      originalPrice: 800,
      discountedPrice: 600,
      discount: "25%",
      imageUrl: "/images/educationPic.webp",
      isOnline: true,
      isGeorgia: true,
      syllabusKa: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      syllabusEn: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      mentorKa: "გიორგი ბაგრატიონი",
      mentorEn: "George Bagrationi",

      // 👇 nested create videos & materials
      videos: {
        create: [
          { url: "https://youtube.com/embed/dQw4w9WgXcQ" },
          { url: "https://youtube.com/embed/example2" },
        ],
      },
      materials: {
        create: [
          { link: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
          { link: "https://react.dev/" },
        ],
      },
    },
  });

  // 🔹 UI/UX Design
  const uiuxCourse = await prisma.course.create({
    data: {
      slug: "uiux-design",
      titleKa: "UI/UX დიზაინი",
      descriptionKa: "ისწავლე ფიგმა, პროტოტაირინგი და დიზაინის საფუძვლები.",
      altTextKa: "დიზაინის კურსი",
      buttonKa: "შეიძინე",
      formatKa: "ადგილზე",
      languageKa: "ქართული",
      titleEn: "UI/UX Design",
      descriptionEn: "Learn Figma, prototyping, and design fundamentals.",
      altTextEn: "Design Course",
      buttonEn: "Buy Now",
      formatEn: "On-site",
      languageEn: "English",
      originalPrice: 1000,
      discountedPrice: 600,
      discount: "30%",
      imageUrl: "/images/educationPic.webp",
      isOnline: false,
      isGeorgia: true,
      syllabusKa: "Figma, UX Research, Wireframing, Prototyping",
      syllabusEn: "Figma, UX Research, Wireframing, Prototyping",
      mentorKa: "ნინი შარაშენიძე",
      mentorEn: "Nini Sharashenidze",
      videos: {
        create: [
          { url: "https://youtube.com/embed/design1" },
          { url: "https://youtube.com/embed/design2" },
        ],
      },
      materials: {
        create: [
          { link: "https://figma.com" },
          { link: "https://uxplanet.org/" },
        ],
      },
    },
  });

  console.log("✅ Courses, videos, and materials seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
