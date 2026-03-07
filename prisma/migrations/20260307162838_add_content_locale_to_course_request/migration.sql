-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "contentLocale" TEXT;

-- AlterTable
ALTER TABLE "CourseRequest" ADD COLUMN     "contentLocale" TEXT,
ALTER COLUMN "titleKa" DROP NOT NULL,
ALTER COLUMN "descriptionKa" DROP NOT NULL;
