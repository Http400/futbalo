import 'dotenv/config';
import { app } from './app.js';
import { syncTeams, syncStadiums } from './services/sync.js';
import { syncMatches } from './services/syncMatches.js';

if (!process.env['JWT_SECRET']) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

const PORT = process.env['PORT'] ?? 4001;

async function main() {
  await syncTeams();
  await syncStadiums();
  await syncMatches();
  app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
  });
}

main().catch(console.error);
