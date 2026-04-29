CREATE TABLE "CourseEnrollment" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key"
ON "CourseEnrollment"("userId", "courseId");

CREATE INDEX "CourseEnrollment_courseId_idx"
ON "CourseEnrollment"("courseId");

CREATE INDEX "CourseEnrollment_userId_idx"
ON "CourseEnrollment"("userId");

ALTER TABLE "CourseEnrollment"
ADD CONSTRAINT "CourseEnrollment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseEnrollment"
ADD CONSTRAINT "CourseEnrollment_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
