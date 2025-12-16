import { IsInt, Min } from 'class-validator';

export class ExtendCourseDto {
  @IsInt()
  @Min(1)
  days: number; // 👉 რამდენი დღით გავზარდოთ
}
