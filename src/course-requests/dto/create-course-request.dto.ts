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

  // ✅ KA required
  @IsString()
  titleKa: string;

  @IsString()
  descriptionKa: string;

  // COURSE-only
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

  // ✅ EN optional (NO auto-translate anymore)
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

  // ✅ media
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  // ✅ Pricing
  @IsOptional()
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  // ✅ Workshop/masterclass date
  @IsOptional()
  @IsString()
  date?: string; // ISO string

  // ✅ Live course start
  @IsOptional()
  @IsString()
  startDate?: string; // ISO

  @IsOptional()
  @IsString()
  endDate?: string; // ISO (optional)

  // ✅ Online/Onsite specifics
  @IsOptional()
  @IsString()
  address?: string; // onsite

  @IsOptional()
  @IsUrl()
  onlineUrl?: string; // online

  // ✅ VIDEO urls
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsUrl({}, { each: true })
  videoUrls?: string[];
}
