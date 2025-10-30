-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalPrice" TEXT,
    "discountedPrice" TEXT,
    "discount" TEXT,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "isOnline" BOOLEAN NOT NULL,
    "isGeorgia" BOOLEAN NOT NULL,
    "button" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
