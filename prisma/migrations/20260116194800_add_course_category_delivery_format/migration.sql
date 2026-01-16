-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('TECHNOLOGY', 'DESIGN', 'ART', 'MARKETING', 'BUSINESS_MANAGEMENT', 'FINANCE', 'LANGUAGES', 'SCIENCE', 'PSYCHOLOGY', 'PERSONAL_DEVELOPMENT', 'HEALTH_WELLNESS', 'CRAFTS_HOBBIES', 'SPORTS', 'OTHER');

-- CreateEnum
CREATE TYPE "CourseDelivery" AS ENUM ('LIVE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('ONLINE', 'ONSITE');

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" "CourseCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "delivery" "CourseDelivery" NOT NULL DEFAULT 'LIVE',
ADD COLUMN     "format" "CourseFormat" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "CourseRequest" ADD COLUMN     "category" "CourseCategory",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "delivery" "CourseDelivery",
ADD COLUMN     "discount" TEXT,
ADD COLUMN     "discountedPrice" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "format" "CourseFormat",
ADD COLUMN     "languageEn" TEXT,
ADD COLUMN     "languageKa" TEXT,
ADD COLUMN     "listingDays" INTEGER,
ADD COLUMN     "listingFee" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mentorEn" TEXT,
ADD COLUMN     "mentorKa" TEXT,
ADD COLUMN     "originalPrice" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CourseRequestVideo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER,
    "courseRequestId" TEXT NOT NULL,

    CONSTRAINT "CourseRequestVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRequestMaterial" (
    "id" SERIAL NOT NULL,
    "link" TEXT NOT NULL,
    "courseRequestId" TEXT NOT NULL,

    CONSTRAINT "CourseRequestMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseRequestVideo_courseRequestId_idx" ON "CourseRequestVideo"("courseRequestId");

-- CreateIndex
CREATE INDEX "CourseRequestMaterial_courseRequestId_idx" ON "CourseRequestMaterial"("courseRequestId");

-- CreateIndex
CREATE INDEX "Material_courseId_idx" ON "Material"("courseId");

-- CreateIndex
CREATE INDEX "Video_courseId_idx" ON "Video"("courseId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRequestVideo" ADD CONSTRAINT "CourseRequestVideo_courseRequestId_fkey" FOREIGN KEY ("courseRequestId") REFERENCES "CourseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRequestMaterial" ADD CONSTRAINT "CourseRequestMaterial_courseRequestId_fkey" FOREIGN KEY ("courseRequestId") REFERENCES "CourseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
