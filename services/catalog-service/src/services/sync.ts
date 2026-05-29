import { prisma } from '../db.js';
import { fetchOpenfootball, fetchRezarahiminia } from '../lib/fetchTeams.js';
import type { Continent, Confederation } from '../generated/prisma/index.js';

const continentMap: Record<string, Continent> = {
  Africa: 'AFRICA',
  Asia: 'ASIA',
  Europe: 'EUROPE',
  'North America': 'NORTH_AMERICA',
  Oceania: 'OCEANIA',
  'South America': 'SOUTH_AMERICA',
};

const confederationMap: Record<string, Confederation> = {
  AFC: 'AFC',
  CAF: 'CAF',
  CONCACAF: 'CONCACAF',
  CONMEBOL: 'CONMEBOL',
  OFC: 'OFC',
  UEFA: 'UEFA',
};

export async function syncTeams(): Promise<void> {
  try {
    const [source1, source2] = await Promise.all([
      fetchOpenfootball(),
      fetchRezarahiminia(),
    ]);

    const source2Map = new Map(source2.map((t) => [t.fifa_code, t]));

    let synced = 0;

    for (const team of source1) {
      const continent = continentMap[team.continent];
      const confederation = confederationMap[team.confed];

      if (continent === undefined || confederation === undefined) {
        console.warn(
          `Skipping team ${team.fifa_code}: unknown continent "${team.continent}" or confederation "${team.confed}"`,
        );
        continue;
      }

      const s2 = source2Map.get(team.fifa_code);

      await prisma.team.upsert({
        where: { fifaCode: team.fifa_code },
        update: {
          name: team.name,
          continent,
          confederation,
          flagUrl: s2?.flag ?? null,
          flagIcon: team.flag_icon ?? null,
        },
        create: {
          fifaCode: team.fifa_code,
          name: team.name,
          continent,
          confederation,
          flagUrl: s2?.flag ?? null,
          flagIcon: team.flag_icon ?? null,
        },
      });

      synced++;
    }

    console.log(`Teams synced: ${synced}`);
  } catch (err) {
    console.error('Failed to sync teams:', err);
  }
}
