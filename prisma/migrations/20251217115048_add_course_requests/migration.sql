-- CreateEnum
CREATE TYPE "CourseRequestStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CourseRequest" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "type" "CourseType" NOT NULL DEFAULT 'COURSE',
    "titleKa" TEXT NOT NULL,
    "titleEn" TEXT,
    "descriptionKa" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "days" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "CourseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseRequest_creatorId_idx" ON "CourseRequest"("creatorId");

-- CreateIndex
CREATE INDEX "CourseRequest_status_idx" ON "CourseRequest"("status");

-- AddForeignKey
ALTER TABLE "CourseRequest" ADD CONSTRAINT "CourseRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
