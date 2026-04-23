import {
  CourseCategory,
  CourseDelivery,
  CourseFormat,
  CourseStatus,
  CourseType,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsUrl,
  IsBoolean,
} from 'class-validator';

/**
 * Fields an admin is explicitly allowed to update on an existing course.
 * Intentionally excludes: id, slug, creatorId, createdAt, updatedAt.
 */
export class UpdateCourseDto {
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsOptional()
  @IsEnum(CourseDelivery)
  delivery?: CourseDelivery;

  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @IsOptional()
  @IsBoolean()
  isGeorgia?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  titleKa?: string;

  @IsOptional()
  @IsString()
  descriptionKa?: string;

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
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  listingDays?: number;
}
