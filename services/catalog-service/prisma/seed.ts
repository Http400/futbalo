import { prisma } from '../src/db.js';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

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

  console.log(`\nSeed complete — 1 competition, ${GROUPS.length} groups.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
