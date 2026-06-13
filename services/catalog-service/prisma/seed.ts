import { prisma } from '../src/db.js';
import { seedCompetition } from '../src/services/seedCompetition.js';

async function main() {
  await seedCompetition();
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
