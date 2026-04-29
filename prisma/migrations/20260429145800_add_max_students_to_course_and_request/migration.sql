-- Add per-course registration capacity
ALTER TABLE "Course"
ADD COLUMN "maxStudents" INTEGER;

-- Preserve capacity chosen during request flow
ALTER TABLE "CourseRequest"
ADD COLUMN "maxStudents" INTEGER;
