import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class RateCourseDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
