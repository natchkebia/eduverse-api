/*
  Warnings:

  - You are about to drop the column `discount` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `CourseRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "discount",
DROP COLUMN "isOnline";

-- AlterTable
ALTER TABLE "CourseRequest" DROP COLUMN "discount";

-- Course: non-negative + discounted <= original + percent range
ALTER TABLE "Course"
  ADD CONSTRAINT "course_original_price_nonneg"
    CHECK ("originalPrice" >= 0),
  ADD CONSTRAINT "course_discounted_price_nonneg"
    CHECK ("discountedPrice" IS NULL OR "discountedPrice" >= 0),
  ADD CONSTRAINT "course_discounted_lte_original"
    CHECK ("discountedPrice" IS NULL OR "discountedPrice" <= "originalPrice"),
  ADD CONSTRAINT "course_discount_percent_range"
    CHECK ("discountPercent" IS NULL OR ("discountPercent" >= 0 AND "discountPercent" <= 100));

-- CourseRequest: same checks (optional fields)
ALTER TABLE "CourseRequest"
  ADD CONSTRAINT "cr_original_price_nonneg"
    CHECK ("originalPrice" IS NULL OR "originalPrice" >= 0),
  ADD CONSTRAINT "cr_discounted_price_nonneg"
    CHECK ("discountedPrice" IS NULL OR "discountedPrice" >= 0),
  ADD CONSTRAINT "cr_discounted_lte_original"
    CHECK ("originalPrice" IS NULL OR "discountedPrice" IS NULL OR "discountedPrice" <= "originalPrice"),
  ADD CONSTRAINT "cr_discount_percent_range"
    CHECK ("discountPercent" IS NULL OR ("discountPercent" >= 0 AND "discountPercent" <= 100));
