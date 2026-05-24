import { CourseListingDecision } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CourseListingDecisionDto {
  @IsEnum(CourseListingDecision)
  decision: CourseListingDecision;

  @IsOptional()
  @IsInt()
  @Min(1)
  extensionDays?: number;
}
