-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('COURSE', 'WORKSHOP', 'MASTERCLASS');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "type" "CourseType" NOT NULL DEFAULT 'COURSE';
