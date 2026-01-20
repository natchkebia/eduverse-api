import { CourseType } from '@prisma/client';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  slug: string;

  @IsOptional()
  type?: CourseType;

  originalPrice: number;
  discountedPrice: number;
  imageUrl: string;

  /** ✅ KA required */
  titleKa: string;
  descriptionKa: string;
  altTextKa: string;
  buttonKa: string;
  formatKa: string;
  languageKa: string;

  /** ✅ EN optional */
  @IsOptional()
  titleEn?: string;

  @IsOptional()
  descriptionEn?: string;

  @IsOptional()
  altTextEn?: string;

  @IsOptional()
  buttonEn?: string;

  @IsOptional()
  formatEn?: string;

  @IsOptional()
  languageEn?: string;

  @IsInt()
  @Min(1)
  duration: number;
}
