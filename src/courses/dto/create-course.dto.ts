import {
  CourseCategory,
  CourseDelivery,
  CourseFormat,
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
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  slug: string;

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

  // ✅ Workshop/LIVE extra location fields
  @IsOptional()
  @IsString()
  address?: string; // ONSITE

  @IsOptional()
  @IsUrl()
  onlineUrl?: string; // ONLINE

  @IsOptional()
  isGeorgia?: boolean;

  // ✅ Pricing
  @IsInt()
  @Min(0)
  originalPrice: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  @IsString()
  imageUrl: string;

  // ✅ i18n
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

  // ✅ Dates
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  date?: string; // workshop/masterclass date

  // ✅ listing duration (days) → listingEndsAt
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  listingDays?: number;
}
