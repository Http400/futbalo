-- CreateTable
CREATE TABLE "catalog"."competitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "edition" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."groups" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competitions_name_edition_key" ON "catalog"."competitions"("name", "edition");

-- CreateIndex
CREATE UNIQUE INDEX "groups_competitionId_name_key" ON "catalog"."groups"("competitionId", "name");

-- AddForeignKey
ALTER TABLE "catalog"."groups" ADD CONSTRAINT "groups_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "catalog"."competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
