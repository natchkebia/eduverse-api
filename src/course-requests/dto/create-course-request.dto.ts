import { CourseType, CourseCategory } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsUrl,
  ValidateIf,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  Matches,
} from 'class-validator';

export class CreateCourseRequestDto {
  @IsEnum(CourseType)
  type: CourseType;

  @IsEnum(CourseCategory)
  category: CourseCategory;

  // TEST MODE: format string ('ONLINE' | 'ONSITE')
  @Matches(/^(ONLINE|ONSITE)$/)
  format: 'ONLINE' | 'ONSITE';

  // TEST MODE: delivery string ('LIVE' | 'VIDEO') მხოლოდ COURSE-ზე
  @ValidateIf((o) => o.type === CourseType.COURSE)
  @Matches(/^(LIVE|VIDEO)$/)
  delivery?: 'LIVE' | 'VIDEO';

  @IsString()
  @MinLength(3)
  titleKa: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsString()
  @MinLength(10)
  descriptionKa: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsString()
  @MinLength(2)
  languageKa: string;

  @IsOptional()
  @IsString()
  languageEn?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE)
  @IsString()
  @MinLength(2)
  mentorKa?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE)
  @IsOptional()
  @IsString()
  mentorEn?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE)
  @IsString()
  @MinLength(10)
  syllabusKa?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE)
  @IsOptional()
  @IsString()
  syllabusEn?: string;

  @ValidateIf((o) => o.type !== CourseType.COURSE)
  @IsDateString()
  date?: string;

  // location მაშინ როცა ONSITE
  @ValidateIf((o) => o.format === 'ONSITE')
  @IsString()
  @MinLength(2)
  location?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE && o.delivery === 'LIVE')
  @IsDateString()
  startDate?: string;

  @ValidateIf((o) => o.type === CourseType.COURSE && o.delivery === 'VIDEO')
  @IsArray()
  @ArrayMaxSize(25)
  @IsUrl({}, { each: true })
  videoUrls?: string[];

  @IsInt()
  @Min(0)
  price: number;

  @ValidateIf((o) => o.type === CourseType.COURSE)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
