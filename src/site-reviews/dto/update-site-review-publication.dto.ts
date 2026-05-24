import { IsBoolean } from 'class-validator';

export class UpdateSiteReviewPublicationDto {
  @IsBoolean()
  published: boolean;
}
