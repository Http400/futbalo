const OPENFOOTBALL_URL =
  process.env['MATCHES_SOURCE_OPENFOOTBALL'] ??
  'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json';

const REZARAHIMINIA_URL =
  process.env['MATCHES_SOURCE_REZARAHIMINIA'] ??
  'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.matches.json';

export interface OpenfootballMatch {
  round: string;
  date: string;
  time?: string;
  team1?: string;
  team2?: string;
  group?: string;
  ground?: string;
  score?: { ft: [number, number] };
}

interface OpenfootballMatchesResponse {
  name: string;
  matches: OpenfootballMatch[];
}

export interface RezarahiminiaMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
}

export async function fetchOpenfootballMatches(): Promise<OpenfootballMatch[]> {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`Failed to fetch openfootball matches: ${res.status}`);
  const data = (await res.json()) as OpenfootballMatchesResponse;
  return data.matches;
}

export async function fetchRezarahiminiaMatches(): Promise<RezarahiminiaMatch[]> {
  const res = await fetch(REZARAHIMINIA_URL);
  if (!res.ok) throw new Error(`Failed to fetch rezarahiminia matches: ${res.status}`);
  return res.json() as Promise<RezarahiminiaMatch[]>;
}
