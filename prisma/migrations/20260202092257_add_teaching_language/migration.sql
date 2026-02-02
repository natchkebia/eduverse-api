-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "teachingLanguage" "TeachingLanguage" NOT NULL DEFAULT 'KA';

-- AlterTable
ALTER TABLE "CourseRequest" ADD COLUMN     "teachingLanguage" "TeachingLanguage" NOT NULL DEFAULT 'KA';
