import { CourseType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsUrl,
} from 'class-validator';

export class CreateCourseRequestDto {
  @IsEnum(CourseType)
  type: CourseType;

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
}
