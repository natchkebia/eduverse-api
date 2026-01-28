/*
  Warnings:

  - You are about to drop the column `altTextEn` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `altTextKa` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `buttonEn` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `buttonKa` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `formatEn` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `formatKa` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `languageEn` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `languageKa` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `mentorEn` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `mentorKa` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `days` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `languageEn` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `languageKa` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `mentorEn` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `mentorKa` on the `CourseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `CourseRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "altTextEn",
DROP COLUMN "altTextKa",
DROP COLUMN "buttonEn",
DROP COLUMN "buttonKa",
DROP COLUMN "formatEn",
DROP COLUMN "formatKa",
DROP COLUMN "languageEn",
DROP COLUMN "languageKa",
DROP COLUMN "location",
DROP COLUMN "mentorEn",
DROP COLUMN "mentorKa",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "mentorBioEn" TEXT,
ADD COLUMN     "mentorBioKa" TEXT,
ADD COLUMN     "mentorFirstNameEn" TEXT,
ADD COLUMN     "mentorFirstNameKa" TEXT,
ADD COLUMN     "mentorLastNameEn" TEXT,
ADD COLUMN     "mentorLastNameKa" TEXT,
ADD COLUMN     "onlineUrl" TEXT;

-- AlterTable
ALTER TABLE "CourseRequest" DROP COLUMN "days",
DROP COLUMN "languageEn",
DROP COLUMN "languageKa",
DROP COLUMN "location",
DROP COLUMN "mentorEn",
DROP COLUMN "mentorKa",
DROP COLUMN "price",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "enAutoTranslated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentorBioEn" TEXT,
ADD COLUMN     "mentorBioKa" TEXT,
ADD COLUMN     "mentorFirstNameEn" TEXT,
ADD COLUMN     "mentorFirstNameKa" TEXT,
ADD COLUMN     "mentorLastNameEn" TEXT,
ADD COLUMN     "mentorLastNameKa" TEXT,
ADD COLUMN     "onlineUrl" TEXT;
