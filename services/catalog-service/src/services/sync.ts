import { prisma } from '../db.js';
import { fetchOpenfootball, fetchRezarahiminia } from '../lib/fetchTeams.js';
import {
  fetchOpenfootballStadiums,
  fetchRezarahiminiaStadiums,
} from '../lib/fetchStadiums.js';
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

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

export async function syncStadiums(): Promise<void> {
  try {
    const [source1, source2] = await Promise.all([
      fetchOpenfootballStadiums(),
      fetchRezarahiminiaStadiums(),
    ]);

    let synced = 0;

    for (const stadium of source1) {
      const normalizedS1 = normalizeName(stadium.name);

      const s2 = source2.find((s) => {
        const normalizedS2 = normalizeName(s.name_en);
        return normalizedS2 === normalizedS1 || normalizedS2.includes(normalizedS1);
      });

      await prisma.stadium.upsert({
        where: { name: stadium.name },
        update: {
          fifaName: s2?.fifa_name ?? null,
          city: stadium.city,
          country: s2?.country_en ?? null,
          countryCode: stadium.cc.toLowerCase(),
          timezone: stadium.timezone,
          capacity: stadium.capacity,
          coords: stadium.coords ?? null,
          region: s2?.region ?? null,
        },
        create: {
          name: stadium.name,
          fifaName: s2?.fifa_name ?? null,
          city: stadium.city,
          country: s2?.country_en ?? null,
          countryCode: stadium.cc.toLowerCase(),
          timezone: stadium.timezone,
          capacity: stadium.capacity,
          coords: stadium.coords ?? null,
          region: s2?.region ?? null,
        },
      });

      synced++;
    }

    console.log(`Stadiums synced: ${synced}`);
  } catch (err) {
    console.error('Failed to sync stadiums:', err);
  }
}
