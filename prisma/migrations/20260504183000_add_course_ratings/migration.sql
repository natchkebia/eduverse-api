CREATE TABLE "CourseRating" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseRating_userId_courseId_key"
ON "CourseRating"("userId", "courseId");

CREATE INDEX "CourseRating_courseId_idx"
ON "CourseRating"("courseId");

CREATE INDEX "CourseRating_userId_idx"
ON "CourseRating"("userId");

ALTER TABLE "CourseRating"
ADD CONSTRAINT "CourseRating_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseRating"
ADD CONSTRAINT "CourseRating_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseRating"
ADD CONSTRAINT "CourseRating_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);
