import 'dotenv/config';
import { app } from './app.js';
import { syncTeams } from './services/sync.js';

const PORT = process.env['PORT'] ?? 4001;

async function main() {
  await syncTeams();
  app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
  });
}

main().catch(console.error);
