import {
  CourseCategory,
  CourseDelivery,
  CourseFormat,
  CourseRequestStatus,
  CourseType,
  TeachingLanguage,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsUrl,
  IsIn,
  IsEmail,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * Fields an admin is explicitly allowed to update on a course request.
 * Intentionally excludes: id, creatorId, createdAt, updatedAt.
 */
export class AdminUpdateRequestDto {
  @IsOptional()
  @IsIn(['ka', 'en'])
  contentLocale?: 'ka' | 'en';

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
  @IsEnum(TeachingLanguage)
  teachingLanguage?: TeachingLanguage;

  @IsOptional()
  @IsEnum(CourseRequestStatus)
  status?: CourseRequestStatus;

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
  date?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @Matches(/^[+0-9().\s-]+$/, {
    message:
      'contactPhone must contain only digits, spaces, +, parentheses, dots, or hyphens',
  })
  contactPhone?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number;
}
