import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SetListingDto {
  @IsInt()
  @Min(1)
  @Max(30)
  listingDays: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  listingFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerDay?: number;
}
