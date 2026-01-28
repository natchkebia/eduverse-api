import { IsInt, Min } from 'class-validator';

export class SetListingDto {
  @IsInt()
  @Min(1)
  listingDays: number;
}
