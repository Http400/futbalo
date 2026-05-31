-- CreateTable
CREATE TABLE "catalog"."stages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "competitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stages_competitionId_code_key" ON "catalog"."stages"("competitionId", "code");

-- AddForeignKey
ALTER TABLE "catalog"."stages" ADD CONSTRAINT "stages_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "catalog"."competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
