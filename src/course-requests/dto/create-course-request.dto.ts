import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  ArrayMaxSize,
} from "class-validator";
import {
  CourseType,
  CourseCategory,
  CourseDelivery,
  CourseFormat,
} from "@prisma/client";

export class CreateCourseRequestDto {
  @IsEnum(CourseType)
  type: CourseType;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @IsOptional()
  @IsEnum(CourseDelivery)
  delivery?: CourseDelivery;

  @IsString()
  titleKa: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsString()
  descriptionKa: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  languageKa?: string;

  @IsOptional()
  @IsString()
  languageEn?: string;

  // ✅ Pricing (both variants)
  @IsOptional()
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  // Dates
  @IsOptional()
  @IsString()
  date?: string; // workshop/masterclass date ISO

  @IsOptional()
  @IsString()
  startDate?: string; // live course start ISO

  @IsOptional()
  @IsString()
  location?: string;

  // COURSE extras
  @IsOptional()
  @IsString()
  syllabusKa?: string;

  @IsOptional()
  @IsString()
  syllabusEn?: string;

  @IsOptional()
  @IsString()
  mentorKa?: string;

  @IsOptional()
  @IsString()
  mentorEn?: string;

  // VIDEO urls
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  videoUrls?: string[];
}
