/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Made the column `originalPrice` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discountedPrice` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `altText` on table `Course` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "createdAt",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "originalPrice" SET NOT NULL,
ALTER COLUMN "discountedPrice" SET NOT NULL,
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "altText" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
