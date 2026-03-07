import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  ArrayMaxSize,
  IsUrl,
  ValidateIf,
  IsIn,
} from 'class-validator';
import {
  CourseType,
  CourseCategory,
  CourseDelivery,
  CourseFormat,
  TeachingLanguage,
} from '@prisma/client';

export class CreateCourseRequestDto {
  @IsIn(['ka', 'en'])
  contentLocale: 'ka' | 'en';

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

  @ValidateIf((o) => o.contentLocale === 'ka')
  @IsString()
  titleKa: string;

  @ValidateIf((o) => o.contentLocale === 'ka')
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

  @ValidateIf((o) => o.contentLocale === 'en')
  @IsString()
  titleEn: string;

  @ValidateIf((o) => o.contentLocale === 'en')
  @IsString()
  descriptionEn: string;

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
  @IsArray()
  @ArrayMaxSize(25)
  @IsUrl({}, { each: true })
  videoUrls?: string[];
}