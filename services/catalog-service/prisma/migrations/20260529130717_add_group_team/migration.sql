-- CreateTable
CREATE TABLE "catalog"."group_teams" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "group_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_teams_groupId_teamId_key" ON "catalog"."group_teams"("groupId", "teamId");

-- AddForeignKey
ALTER TABLE "catalog"."group_teams" ADD CONSTRAINT "group_teams_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "catalog"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."group_teams" ADD CONSTRAINT "group_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "catalog"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
