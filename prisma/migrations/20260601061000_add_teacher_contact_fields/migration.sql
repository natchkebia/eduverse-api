-- AlterTable
ALTER TABLE "CourseRequest"
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactEmail" TEXT;

-- AlterTable
ALTER TABLE "Course"
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactEmail" TEXT;
