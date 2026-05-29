import { prisma } from '../src/db.js';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json';

interface OpenfootballTeam {
  fifa_code: string;
  group: string;
}

async function main() {
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

  console.log(`\nFetching team-group assignments from openfootball...`);
  const response = await fetch(OPENFOOTBALL_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch openfootball data: ${response.status} ${response.statusText}`);
  }
  const teams = (await response.json()) as OpenfootballTeam[];

  let seeded = 0;
  let skipped = 0;

  for (const entry of teams) {
    const team = await prisma.team.findUnique({ where: { fifaCode: entry.fifa_code } });
    if (!team) {
      console.warn(`  [skip] Team not found in DB: ${entry.fifa_code} — start the service once first`);
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
    console.log(`  GroupTeam seeded: ${team.name} → Group ${group.name}`);
    seeded++;
  }

  console.log(
    `\nSeed complete — 1 competition, ${GROUPS.length} groups, ${seeded} group-team assignments (${skipped} skipped).`,
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
