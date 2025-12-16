import { CourseType } from '@prisma/client';
import { IsInt, Min } from 'class-validator';

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

  @IsInt()
  @Min(1)
  duration: number; // 👉 რამდენი დღე გაგრძელდეს თავიდან
}
