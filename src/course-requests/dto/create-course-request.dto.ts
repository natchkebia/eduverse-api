import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import {
  CourseType,
  CourseCategory,
  CourseDelivery,
  CourseFormat,
  TeachingLanguage,
} from '@prisma/client';

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

  @IsOptional()
  @IsEnum(TeachingLanguage)
  teachingLanguage?: TeachingLanguage;

  @IsString()
  titleKa: string;

  @IsString()
  descriptionKa: string;

  @IsOptional()
  @IsString()
  syllabusKa?: string;

  @IsOptional()
  @IsString()
  mentorFirstNameKa?: string;

  @IsOptional()
  @IsString()
  mentorLastNameKa?: string;

  @IsOptional()
  @IsString()
  mentorBioKa?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  syllabusEn?: string;

  @IsOptional()
  @IsString()
  mentorFirstNameEn?: string;

  @IsOptional()
  @IsString()
  mentorLastNameEn?: string;

  @IsOptional()
  @IsString()
  mentorBioEn?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  @IsOptional()
  @IsString()
  date?: string; // ISO

  @IsOptional()
  @IsString()
  startDate?: string; // ISO

  @IsOptional()
  @IsString()
  endDate?: string; // ISO

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsUrl({}, { each: true })
  videoUrls?: string[];
}
