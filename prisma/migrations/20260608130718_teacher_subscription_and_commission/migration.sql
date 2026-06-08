-- CreateEnum
CREATE TYPE "TeacherSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "CourseEnrollment" ADD COLUMN     "creatorEarnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "platformFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePaid" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TeacherSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TeacherSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "monthlyFee" INTEGER NOT NULL DEFAULT 30,
    "currentPeriodEnd" TIMESTAMP(3),
    "lastPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubscription_userId_key" ON "TeacherSubscription"("userId");

-- CreateIndex
CREATE INDEX "TeacherSubscription_status_idx" ON "TeacherSubscription"("status");

-- CreateIndex
CREATE INDEX "TeacherSubscription_currentPeriodEnd_idx" ON "TeacherSubscription"("currentPeriodEnd");

-- AddForeignKey
ALTER TABLE "TeacherSubscription" ADD CONSTRAINT "TeacherSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
