import {
  CourseCategory,
  CourseDelivery,
  CourseFormat,
  CourseType,
} from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateIf,
} from "class-validator";

export class CreateCourseDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsOptional()
  @IsEnum(CourseDelivery)
  delivery?: CourseDelivery;

  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  isGeorgia?: boolean; // თუ გინდა, უკეთესია DTO-ში Boolean ვალიდაციაც დავუმატოთ

  // ✅ Pricing
  @IsInt()
  @Min(0)
  originalPrice: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountedPrice?: number | null;

  // ❗ არ ვიღებთ discountPercent-ს ფრონტიდან
  // ❗ სერვისი თვითონ ითვლის

  @IsString()
  imageUrl: string;

  /** ✅ KA required */
  @IsString()
  titleKa: string;

  @IsString()
  descriptionKa: string;

  @IsString()
  altTextKa: string;

  @IsString()
  buttonKa: string;

  @IsString()
  formatKa: string;

  @IsString()
  languageKa: string;

  /** ✅ EN optional */
  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  altTextEn?: string;

  @IsOptional()
  @IsString()
  buttonEn?: string;

  @IsOptional()
  @IsString()
  formatEn?: string;

  @IsOptional()
  @IsString()
  languageEn?: string;

  // ✅ listing duration days (for listingEndsAt)
  @IsInt()
  @Min(1)
  @Max(365)
  duration: number;

  /**
   * თუ ტიპი WORKSHOP-ია, ჩვეულებრივ "date" საჭიროა.
   * (თუ შენს ლოგიკაში სხვანაირადაა, ეს ნაწილი მოიშორე)
   */
  @ValidateIf((o: CreateCourseDto) => o.type === "WORKSHOP")
  @IsOptional()
  // Date string-ის ვალიდაცია უკეთესია IsDateString-ით, მაგრამ შენ აქ არ გაქვს შემოტანილი
  date?: string;
}
