import { IsInt, Max, Min } from "class-validator";

export class SetListingDto {
  @IsInt()
  @Min(1)
  @Max(30)
  listingDays: number;
}
