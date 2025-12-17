import { IsInt, Min } from 'class-validator';

export class SetCourseRequestDetailsDto {
  @IsInt()
  @Min(1)
  days: number;

  @IsInt()
  @Min(0)
  price: number;
}
