import { CourseType } from '@prisma/client';

export class CreateCourseDto {
  slug: string;
  type?: CourseType;
  originalPrice: number;
  discountedPrice: number;
  imageUrl: string;
  titleKa: string;
  titleEn: string;
  descriptionKa: string;
  descriptionEn: string;
  altTextKa: string;
  altTextEn: string;
  buttonKa: string;
  buttonEn: string;
  formatKa: string;
  formatEn: string;
  languageKa: string;
  languageEn: string;
  duration: number;
}
