-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateEnum
CREATE TYPE "catalog"."Continent" AS ENUM ('AFRICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA');

-- CreateEnum
CREATE TYPE "catalog"."Confederation" AS ENUM ('AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA');

-- CreateTable
CREATE TABLE "catalog"."teams" (
    "id" TEXT NOT NULL,
    "fifaCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "continent" "catalog"."Continent" NOT NULL,
    "confederation" "catalog"."Confederation" NOT NULL,
    "flagUrl" TEXT,
    "flagIcon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_fifaCode_key" ON "catalog"."teams"("fifaCode");
