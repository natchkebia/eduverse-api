-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "listingEndsAt" TIMESTAMP(3),
ALTER COLUMN "discountedPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CourseRequest" ADD COLUMN     "discountPercent" INTEGER;

-- CreateIndex
CREATE INDEX "Course_type_status_idx" ON "Course"("type", "status");

-- CreateIndex
CREATE INDEX "Course_discountPercent_idx" ON "Course"("discountPercent");

-- CreateIndex
CREATE INDEX "Course_listingEndsAt_idx" ON "Course"("listingEndsAt");

-- CreateIndex
CREATE INDEX "CourseRequest_discountPercent_idx" ON "CourseRequest"("discountPercent");
