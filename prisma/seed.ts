import { PrismaClient, CourseType, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { addDays, addMonths } from "date-fns";

const prisma = new PrismaClient();

function assertDevSeedAllowed() {
  // ✅ production-ზე საერთოდ არ ვუშვებთ seed-ს
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Seeding is disabled in production.");
  }

  // ✅ სურვილისამებრ: თუ გინდა უფრო მკაცრი, ჩართე ALLOW_SEED=true
  // if (process.env.ALLOW_SEED !== "true") {
  //   throw new Error("❌ Set ALLOW_SEED=true to run seed.");
  // }
}

async function upsertAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ℹ️ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: process.env.ADMIN_NAME || "Admin",
        surname: process.env.ADMIN_SURNAME || null,
        role: Role.ADMIN,
        verified: true,
      },
    });
    console.log("✅ Admin user created");
  } else {
    console.log("⚠️ Admin already exists");
  }
}

async function upsertFakeStudent() {
  // ✅ fake user-საც env-იდან ვაძლევთ ან default test
  const studentEmail = process.env.SEED_STUDENT_EMAIL || "student@test.com";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "Student123!";

  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash(studentPassword, 10);
    await prisma.user.create({
      data: {
        email: studentEmail,
        password: hashedPassword,
        name: "Test",
        surname: "Student",
        role: Role.STUDENT,
        verified: true,
      },
    });

    console.log("✅ Fake STUDENT user created");
  } else {
    console.log("⚠️ Fake STUDENT already exists");
  }
}

function buildCourses() {
  const now = new Date();

  return [
    {
      slug: "frontend-development",
      type: CourseType.COURSE,
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
      discount: "25%",
      imageUrl: "/images/educationPic.webp",
      isOnline: true,
      isGeorgia: true,
      syllabusKa: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      syllabusEn: "HTML, CSS, JavaScript, React, Next.js, TypeScript",
      mentorKa: "გიორგი ბაგრატიონი",
      mentorEn: "George Bagrationi",
      videos: [{ url: "https://youtube.com/embed/dQw4w9WgXcQ" }],
      materials: [{ link: "https://react.dev" }],
      startDate: now,
      endDate: addMonths(now, 1),
      date: null, // ✅ Course-ზე date არ გვინდა
    },

    {
      slug: "uiux-design",
      type: CourseType.COURSE,
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
      discount: "30%",
      imageUrl: "/images/educationPic.webp",
      isOnline: false,
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
      discount: "20%",
      imageUrl: "/images/educationPic.webp",
      isOnline: false,
      isGeorgia: true,
      // ✅ Workshop-ზე მთავარი არის date
      date: addDays(now, 7),
      location: "თბილისი, GMT Plaza",
      startDate: null,
      endDate: null,
    },

    {
      slug: "ai-workshop",
      type: CourseType.WORKSHOP,
      titleKa: "ხელოვნური ინტელექტის ვორკშოფი",
      titleEn: "AI Workshop",
      descriptionKa: "ერთდღიანი ინტენსიური პრაქტიკული ვორკშოფი AI-ზე.",
      descriptionEn: "One-day intensive practical AI workshop.",
      altTextKa: "ვორკშოფი",
      altTextEn: "Workshop",
      buttonKa: "დაჯავშნა",
      buttonEn: "Book now",
      formatKa: "ონლაინ",
      formatEn: "Online",
      languageKa: "ინგლისური",
      languageEn: "English",
      originalPrice: 0,
      discountedPrice: 0,
      discount: null,
      imageUrl: "/images/educationPic.webp",
      isOnline: true,
      isGeorgia: false,
      date: addDays(now, 14),
      location: "ონლაინ",
      startDate: null,
      endDate: null,
    },
  ];
}

async function upsertCoursesAndWorkshops() {
  const courses = buildCourses();
  const workshops = buildWorkshops();

  const all = [...courses, ...workshops];

  for (const item of all) {
    const { videos, materials, ...courseData } = item as any;

    await prisma.course.upsert({
      where: { slug: item.slug },
      update: {
        ...courseData,

        // ✅ უსაფრთხო ვარიანტი: nested relations არ წავშალოთ ავტომატურად
        ...(videos
          ? {
              videos: {
                deleteMany: {}, // dev-ზე OK, prod-ზე seed ისედაც არ ეშვება
                create: videos,
              },
            }
          : {}),

        ...(materials
          ? {
              materials: {
                deleteMany: {},
                create: materials,
              },
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
  assertDevSeedAllowed();

  await upsertAdmin();
  await upsertFakeStudent();
  await upsertCoursesAndWorkshops();

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((err) => console.error("❌ Seed failed:", err))
  .finally(() => prisma.$disconnect());
