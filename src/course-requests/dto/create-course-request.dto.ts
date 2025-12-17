import { CourseType } from '@prisma/client';

export class CreateCourseRequestDto {
  type: CourseType; // COURSE | WORKSHOP | MASTERCLASS
  titleKa: string;
  titleEn?: string;
  descriptionKa: string;
  descriptionEn?: string;
  imageUrl?: string;
}
