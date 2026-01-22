// prisma/seed.ts

import {
  PrismaClient,
  CourseType,
  Role,
  CourseFormat,
  CourseDelivery,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { addDays, addMonths } from "date-fns";

const prisma = new PrismaClient();

function assertSeedAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Seeding is disabled in production.");
  }
  if (process.env.ALLOW_SEED !== "true") {
    throw new Error("❌ Set ALLOW_SEED=true to run seed.");
  }
}

async function upsertAdmin(tx: PrismaClient) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ℹ️ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await tx.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      verified: true,
      // თუ არ გინდა seed-ზე ყოველ ჯერზე password reset — ეს ხაზი წაშალე
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: process.env.ADMIN_NAME || "Admin",
      surname: process.env.ADMIN_SURNAME || null,
      role: Role.ADMIN,
      verified: true,
    },
  });

  console.log("✅ Admin upserted");
}

async function upsertFakeStudent(tx: PrismaClient) {
  const studentEmail = process.env.SEED_STUDENT_EMAIL;
  const studentPassword = process.env.SEED_STUDENT_PASSWORD;

  // ✅ თუ env არ გაქვს — არ ვქმნით (hardcode აღარ)
  if (!studentEmail || !studentPassword) {
    console.log(
      "ℹ️ SEED_STUDENT_EMAIL / SEED_STUDENT_PASSWORD not set — skipping fake student."
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(studentPassword, 10);

  await tx.user.upsert({
    where: { email: studentEmail },
    update: {
      role: Role.STUDENT,
      verified: true,
      // სურვილისამებრ: password update
      password: hashedPassword,
    },
    create: {
      email: studentEmail,
      password: hashedPassword,
      name: "Test",
      surname: "Student",
      role: Role.STUDENT,
      verified: true,
    },
  });

  console.log("✅ Fake student upserted");
}

function buildCourses() {
  const now = new Date();

  return [
    {
      slug: "frontend-development",
      type: CourseType.COURSE,

      format: CourseFormat.ONLINE,
      delivery: CourseDelivery.LIVE,

      // category თუ გინდა ჩაამატე: CourseCategory.TECHNOLOGY
      titleKa: "Frontend დეველოპერი",
      titleEn: "Frontend Development",
      descriptionKa: "ისწავლე React, Next.js და TypeScript ნულიდან.",
      descriptionEn: "Learn React, Next.js and TypeScript from scratch.",
      altTextKa: "ფრონტენდის კურსი",
      altTextEn: "Frontend Course",
      buttonKa: "შეიძინე",
      buttonEn: "Buy now",
      formatKa: "ონლაინ",
      formatEn: "Online",
      languageKa: "ქართული",
      languageEn: "Georgian",

      originalPrice: 800,
      discountedPrice: 600,
      discountPercent: 25,

      imageUrl: "/images/educationPic.webp",
      isGeorgia: true,

      syllabusKa: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      syllabusEn: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      mentorKa: "გიორგი ბაგრატიონი",
      mentorEn: "George Bagrationi",

      videos: [{ url: "https://youtube.com/embed/dQw4w9WgXcQ" }],
      materials: [{ link: "https://react.dev" }],

      startDate: now,
      endDate: addMonths(now, 1),
      date: null,
    },

    {
      slug: "uiux-design",
      type: CourseType.COURSE,

      format: CourseFormat.ONSITE,
      delivery: CourseDelivery.LIVE,

      titleKa: "UI/UX დიზაინი",
      titleEn: "UI/UX Design",
      descriptionKa: "ისწავლე ფიგმა, UX, პროტოტაირინგი და დიზაინის საფუძვლები.",
      descriptionEn: "Learn Figma, UX, prototyping and design fundamentals.",
      altTextKa: "დიზაინის კურსი",
      altTextEn: "Design Course",
      buttonKa: "შეიძინე",
      buttonEn: "Buy now",
      formatKa: "ადგილზე",
      formatEn: "On-site",
      languageKa: "ქართული",
      languageEn: "Georgian",

      originalPrice: 1000,
      discountedPrice: 600,
      discountPercent: 40,

      imageUrl: "/images/educationPic.webp",
      isGeorgia: true,

      syllabusKa: "Figma, UX Research, Wireframing, Prototyping",
      syllabusEn: "Figma, UX Research, Wireframing, Prototyping",
      mentorKa: "ნინი შარაშენიძე",
      mentorEn: "Nini Sharashenidze",

      videos: [{ url: "https://youtube.com/embed/design1" }],
      materials: [{ link: "https://figma.com" }],

      startDate: now,
      endDate: addMonths(now, 1),
      date: null,
    },
  ];
}

function buildWorkshops() {
  const now = new Date();

  return [
    {
      slug: "photoshop-workshop",
      type: CourseType.WORKSHOP,

      format: CourseFormat.ONSITE,
      delivery: CourseDelivery.LIVE,

      titleKa: "ფოტოშოპის ვორკშოფი",
      titleEn: "Photoshop Workshop",
      descriptionKa: "ერთდღიანი ინტენსიური პრაქტიკული ვორკშოფი ფოტოშოპში.",
      descriptionEn: "One-day intensive practical Photoshop workshop.",
      altTextKa: "ვორკშოფი",
      altTextEn: "Workshop",
      buttonKa: "დაჯავშნა",
      buttonEn: "Book now",
      formatKa: "ადგილზე",
      formatEn: "On-site",
      languageKa: "ქართული",
      languageEn: "Georgian",

      originalPrice: 150,
      discountedPrice: 120,
      discountPercent: 20,

      imageUrl: "/images/educationPic.webp",
      isGeorgia: true,

      date: addDays(now, 7),
      location: "თბილისი, GMT Plaza",
      startDate: null,
      endDate: null,
    },
  ];
}

async function upsertCoursesAndWorkshops(tx: PrismaClient) {
  const all = [...buildCourses(), ...buildWorkshops()];

  for (const item of all) {
    const { videos, materials, ...courseData } = item as any;

    await tx.course.upsert({
      where: { slug: item.slug },
      update: {
        ...courseData,
        ...(videos
          ? {
              videos: { deleteMany: {}, create: videos },
            }
          : {}),
        ...(materials
          ? {
              materials: { deleteMany: {}, create: materials },
            }
          : {}),
      },
      create: {
        ...courseData,
        ...(videos ? { videos: { create: videos } } : {}),
        ...(materials ? { materials: { create: materials } } : {}),
      },
    });
  }
}

async function main() {
  assertSeedAllowed();

  await prisma.$transaction(async (tx) => {
    await upsertAdmin(tx as any);
    await upsertFakeStudent(tx as any);
    await upsertCoursesAndWorkshops(tx as any);
  });

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((err) => console.error("❌ Seed failed:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });
