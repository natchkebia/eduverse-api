-- CreateEnum
CREATE TYPE "CourseListingDecision" AS ENUM ('EXTEND', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "CourseListingDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CourseListingRequest" (
    "id" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "decision" "CourseListingDecision" NOT NULL,
    "extensionDays" INTEGER,
    "status" "CourseListingDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseListingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseListingRequest_courseId_idx" ON "CourseListingRequest"("courseId");

-- CreateIndex
CREATE INDEX "CourseListingRequest_creatorId_idx" ON "CourseListingRequest"("creatorId");

-- CreateIndex
CREATE INDEX "CourseListingRequest_status_idx" ON "CourseListingRequest"("status");

-- CreateIndex
CREATE INDEX "CourseListingRequest_decision_idx" ON "CourseListingRequest"("decision");

-- AddForeignKey
ALTER TABLE "CourseListingRequest" ADD CONSTRAINT "CourseListingRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseListingRequest" ADD CONSTRAINT "CourseListingRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseListingRequest" ADD CONSTRAINT "CourseListingRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
