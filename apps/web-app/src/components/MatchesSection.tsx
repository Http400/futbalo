import { useState } from 'react';
import { MatchCardList } from '@futbalo/ui';
import type { MatchCardProps, MatchStatus as CardMatchStatus } from '@futbalo/ui';
import type { Match, MatchStatus, Stadium, Stage, Team } from '@futbalo/types';
import { useGetMatchesQuery, useGetStadiumsQuery, useGetStagesQuery, useGetTeamsQuery } from '../store/api/catalogApi';
import { parseDmsCoords } from '../utils/coords';

const FETCH_LIMIT = 4;

interface MatchesSectionProps {
  onStadiumFocus?: (coords: { lat: number; lng: number } | null) => void;
}

function mapStatus(status: MatchStatus): CardMatchStatus {
  if (status === 'LIVE') return 'live';
  if (status === 'FINISHED') return 'finished';
  return 'upcoming';
}

const getStadiumTimezone = (stadium: Stadium | undefined): string => {
  if (!stadium) return 'UTC';

  const TIMEZONE_MAP: Record<string, string> = {
    "UTC-8": "America/Los_Angeles",
    "UTC-7": "America/Denver",
    "UTC-6": "America/Chicago",
    "UTC-5": "America/New_York",
  };

  return TIMEZONE_MAP[stadium.timezone] ?? 'UTC';
}

function mapMatchesToCards(
  matches: Match[],
  teamsById: Record<string, Team>,
  stadiumsById: Record<string, Stadium>,
  stagesById: Record<string, Stage>,
): MatchCardProps[] {
  return matches.map((m) => {
    const homeTeam = m.homeTeamId ? teamsById[m.homeTeamId] : undefined;
    const awayTeam = m.awayTeamId ? teamsById[m.awayTeamId] : undefined;
    const stadium = stadiumsById[m.stadiumId];
    const timezone = getStadiumTimezone(stadium);
    const kickoff = m.kickoffAt ? new Date(m.kickoffAt) : null;

    return {
      homeTeam: {
        name: homeTeam?.name ?? m.homePlaceholder ?? 'TBD',
        code: homeTeam?.fifaCode ?? '???',
        flagUrl: homeTeam?.flagUrl ?? '',
      },
      awayTeam: {
        name: awayTeam?.name ?? m.awayPlaceholder ?? 'TBD',
        code: awayTeam?.fifaCode ?? '???',
        flagUrl: awayTeam?.flagUrl ?? '',
      },
      date: kickoff
        ? kickoff.toLocaleDateString('en-GB', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric' })
        : 'TBD',
      time: kickoff
        ? kickoff.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
        : '--:--',
      timezone,
      venue: stadium ? `${stadium.name}, ${stadium.city}` : 'TBD',
      competition: stagesById[m.stageId]?.name ?? 'Unknown Stage',
      status: mapStatus(m.status),
    };
  });
}

export function MatchesSection({ onStadiumFocus }: MatchesSectionProps) {
  const [page, setPage] = useState(1);

  const { data: matchesResponse, isLoading: matchesLoading, isError: matchesError } =
    useGetMatchesQuery({ page, limit: FETCH_LIMIT });

  const { data: teams } = useGetTeamsQuery();
  const { data: stadiums } = useGetStadiumsQuery();
  const { data: stages } = useGetStagesQuery();

  const teamsById: Record<string, Team> = {};
  for (const team of teams ?? []) teamsById[team.id] = team;

  const stadiumsById: Record<string, Stadium> = {};
  for (const stadium of stadiums ?? []) stadiumsById[stadium.id] = stadium;

  const stagesById: Record<string, Stage> = {};
  for (const stage of stages ?? []) stagesById[stage.id] = stage;

  const cards = matchesResponse
    ? mapMatchesToCards(matchesResponse.data, teamsById, stadiumsById, stagesById)
    : [];

  const totalPages = matchesResponse?.totalPages ?? 1;

  function handleItemHover(index: number | null) {
    if (index === null) {
      onStadiumFocus?.(null);
      return;
    }
    const match = matchesResponse?.data[index];
    if (!match) return;
    const stadium = stadiumsById[match.stadiumId];
    const coords = parseDmsCoords(stadium?.coords);
    onStadiumFocus?.(coords);
  }

  return (
    <section style={{ padding: '24px 16px', maxWidth: 700 }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>Matches</h2>

      {matchesLoading && (
        <p style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>Loading matches…</p>
      )}

      {matchesError && (
        <p style={{ textAlign: 'center', color: '#d32f2f', padding: '32px 0' }}>
          Failed to load matches. Please try again later.
        </p>
      )}

      {!matchesLoading && !matchesError && (
        <MatchCardList
          items={cards}
          pageSize={FETCH_LIMIT}
          emptyMessage="No matches found"
          controlledPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onItemHover={handleItemHover}
        />
      )}
    </section>
  );
}
