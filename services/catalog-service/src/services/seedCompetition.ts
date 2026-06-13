import { prisma } from '../db.js';
import { fetchOpenfootball } from '../lib/fetchTeams.js';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const STAGES = [
  { code: 'GS', name: 'Group Stage', sortOrder: 1 },
  { code: 'R32', name: 'Round of 32', sortOrder: 2 },
  { code: 'R16', name: 'Round of 16', sortOrder: 3 },
  { code: 'QF', name: 'Quarter-finals', sortOrder: 4 },
  { code: 'SF', name: 'Semi-finals', sortOrder: 5 },
  { code: 'TPP', name: 'Third Place Playoff', sortOrder: 6 },
  { code: 'FIN', name: 'Final', sortOrder: 7 },
];

export async function seedCompetition(): Promise<void> {
  const competition = await prisma.competition.upsert({
    where: { name_edition: { name: 'FIFA World Cup', edition: 2026 } },
    update: {},
    create: { name: 'FIFA World Cup', edition: 2026 },
  });

  console.log(`Competition seeded: ${competition.name} ${competition.edition} (${competition.id})`);

  for (const name of GROUPS) {
    const group = await prisma.group.upsert({
      where: { competitionId_name: { competitionId: competition.id, name } },
      update: {},
      create: { competitionId: competition.id, name },
    });
    console.log(`  Group seeded: ${group.name} (${group.id})`);
  }

  for (const stage of STAGES) {
    const seeded = await prisma.stage.upsert({
      where: { competitionId_code: { competitionId: competition.id, code: stage.code } },
      update: { name: stage.name, sortOrder: stage.sortOrder },
      create: { competitionId: competition.id, ...stage },
    });
    console.log(`  Stage seeded: ${seeded.code} - ${seeded.name} (${seeded.id})`);
  }

  console.log('\nFetching team-group assignments from openfootball...');
  const teams = await fetchOpenfootball();

  let seeded = 0;
  let skipped = 0;

  for (const entry of teams) {
    const team = await prisma.team.findUnique({ where: { fifaCode: entry.fifa_code } });
    if (!team) {
      console.warn(`  [skip] Team not found in DB: ${entry.fifa_code} - sync teams first`);
      skipped++;
      continue;
    }

    const group = await prisma.group.findUnique({
      where: { competitionId_name: { competitionId: competition.id, name: entry.group } },
    });
    if (!group) {
      console.warn(`  [skip] Group not found: ${entry.group}`);
      skipped++;
      continue;
    }

    await prisma.groupTeam.upsert({
      where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
      create: { groupId: group.id, teamId: team.id },
      update: {},
    });
    console.log(`  GroupTeam seeded: ${team.name} -> Group ${group.name}`);
    seeded++;
  }

  console.log(
    `\nSeed complete - 1 competition, ${GROUPS.length} groups, ${STAGES.length} stages, ${seeded} group-team assignments (${skipped} skipped).`
  );
}
