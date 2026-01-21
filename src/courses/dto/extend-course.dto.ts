import { IsInt, Min } from "class-validator";

export class ExtendCourseDto {
  @IsInt()
  @Min(1)
  duration: number;
}
