import { prisma } from '../db.js';
import type { MatchStatus } from '../generated/prisma/index.js';
import { fetchOpenfootballMatches, fetchRezarahiminiaMatches } from '../lib/fetchMatches.js';
import type { OpenfootballMatch, RezarahiminiaMatch } from '../lib/fetchMatches.js';

const ROUND_TO_STAGE_CODE: Record<string, string> = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarter-final': 'QF',
  'Semi-final': 'SF',
  'Match for third place': 'TPP',
  'Final': 'FIN',
};

function resolveStageCode(round: string): string {
  if (/^Matchday \d+$/.test(round)) return 'GS';
  return ROUND_TO_STAGE_CODE[round] ?? 'GS';
}

function extractGroupLetter(group: string): string | null {
  const m = /Group ([A-L])/i.exec(group);
  return m?.[1]?.toUpperCase() ?? null;
}

function parseKickoffAt(date: string, time: string): Date | null {
  const m = /^(\d{2}:\d{2}) UTC([+-]\d+)$/.exec(time);
  if (!m || !m[1] || !m[2]) return null;
  const hhmm = m[1];
  const offset = parseInt(m[2], 10);
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset).toString().padStart(2, '0');
  return new Date(`${date}T${hhmm}:00${sign}${absOffset}:00`);
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function makeSourceId(match: OpenfootballMatch): string {
  return `of:${match.date}:${toSlug(match.team1 ?? 'tbd')}:${toSlug(match.team2 ?? 'tbd')}`;
}

/** Parse "06/11/2026 13:00" → { date: "2026-06-11", localTime: "13:00" } */
function parseRezarahiminiaDate(localDate: string): { date: string; localTime: string } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})$/.exec(localDate);
  if (!m || !m[1] || !m[2] || !m[3] || !m[4]) return null;
  return { date: `${m[3]}-${m[1]}-${m[2]}`, localTime: m[4] };
}

function resolveMatchStatus(rfMatch: RezarahiminiaMatch): MatchStatus {
  if (rfMatch.finished === 'TRUE') return 'FINISHED';
  if (rfMatch.time_elapsed !== 'notstarted') return 'LIVE';
  return 'SCHEDULED';
}

export async function syncMatches(): Promise<void> {
  try {
    const [ofMatches, rfMatches] = await Promise.all([
      fetchOpenfootballMatches(),
      fetchRezarahiminiaMatches(),
    ]);

    const competition = await prisma.competition.findFirst({
      where: { name: 'FIFA World Cup', edition: 2026 },
    });
    if (!competition) {
      console.warn('syncMatches: FIFA World Cup 2026 competition not found — skipping');
      return;
    }

    const [dbTeams, dbStadiums, dbStages, dbGroups] = await Promise.all([
      prisma.team.findMany(),
      prisma.stadium.findMany(),
      prisma.stage.findMany({ where: { competitionId: competition.id } }),
      prisma.group.findMany({ where: { competitionId: competition.id } }),
    ]);

    const teamsByName = new Map(dbTeams.map((t) => [t.name.toLowerCase(), t.id]));
    const stadiumsByName = new Map(dbStadiums.map((s) => [s.city.toLowerCase(), s.id]));
    const stagesByCode = new Map(dbStages.map((s) => [s.code, s.id]));
    const groupsByName = new Map(dbGroups.map((g) => [g.name.toUpperCase(), g.id]));

    // Build rezarahiminia match lookup: "YYYY-MM-DD|HH:MM" → match
    const rfByDatetime = new Map<string, RezarahiminiaMatch>();
    for (const rfMatch of rfMatches) {
      const parsed = parseRezarahiminiaDate(rfMatch.local_date);
      if (parsed) {
        rfByDatetime.set(`${parsed.date}|${parsed.localTime}`, rfMatch);
      }
    }

    let synced = 0;
    let skipped = 0;

    for (const ofMatch of ofMatches) {
      const stageCode = resolveStageCode(ofMatch.round);
      const stageId = stagesByCode.get(stageCode);
      if (!stageId) {
        console.warn(`syncMatches: no stage found for code "${stageCode}" (round: "${ofMatch.round}")`);
        skipped++;
        continue;
      }

      const stadiumId = ofMatch.ground
        ? stadiumsByName.get(ofMatch.ground.toLowerCase())
        : undefined;
      if (!stadiumId) {
        console.warn(`syncMatches: no stadium found for ground "${ofMatch.ground ?? ''}"`);
        skipped++;
        continue;
      }

      const homeTeamId = ofMatch.team1
        ? (teamsByName.get(ofMatch.team1.toLowerCase()) ?? null)
        : null;
      const awayTeamId = ofMatch.team2
        ? (teamsByName.get(ofMatch.team2.toLowerCase()) ?? null)
        : null;

      // Treat unresolved team names as placeholders for knockout rounds
      const homePlaceholder =
        ofMatch.team1 && homeTeamId === null ? ofMatch.team1 : null;
      const awayPlaceholder =
        ofMatch.team2 && awayTeamId === null ? ofMatch.team2 : null;

      const groupLetter = ofMatch.group ? extractGroupLetter(ofMatch.group) : null;
      const groupId = groupLetter ? (groupsByName.get(groupLetter) ?? null) : null;

      const kickoffAt = ofMatch.time ? parseKickoffAt(ofMatch.date, ofMatch.time) : null;

      // Try to find rezarahiminia match for enrichment (sourceId, scores, status)
      let sourceId: string | null = null;
      let status: MatchStatus = 'SCHEDULED';
      let homeScore: number | null = null;
      let awayScore: number | null = null;

      if (ofMatch.time) {
        const localTime = ofMatch.time.split(' ')[0];
        const rfMatch = localTime ? rfByDatetime.get(`${ofMatch.date}|${localTime}`) : undefined;
        if (rfMatch) {
          sourceId = `rf:${rfMatch.id}`;
          status = resolveMatchStatus(rfMatch);
          const hs = parseInt(rfMatch.home_score, 10);
          const as_ = parseInt(rfMatch.away_score, 10);
          if (status === 'FINISHED' || status === 'LIVE') {
            homeScore = isNaN(hs) ? null : hs;
            awayScore = isNaN(as_) ? null : as_;
          }
        }
      }

      // Fall back to openfootball-derived synthetic sourceId
      if (!sourceId) {
        sourceId = makeSourceId(ofMatch);
      }

      const matchData = {
        competitionId: competition.id,
        stageId,
        stadiumId,
        groupId,
        homeTeamId,
        awayTeamId,
        homePlaceholder,
        awayPlaceholder,
        kickoffAt,
        status,
        homeScore,
        awayScore,
      };

      await prisma.match.upsert({
        where: { sourceId },
        update: matchData,
        create: { sourceId, ...matchData },
      });

      synced++;
    }

    console.log(`Matches synced: ${synced}, skipped: ${skipped}`);
  } catch (err) {
    console.error('Failed to sync matches:', err);
  }
}
