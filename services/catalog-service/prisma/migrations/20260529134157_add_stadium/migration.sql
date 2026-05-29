-- CreateTable
CREATE TABLE "catalog"."stadiums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fifaName" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "coords" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stadiums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stadiums_name_key" ON "catalog"."stadiums"("name");
