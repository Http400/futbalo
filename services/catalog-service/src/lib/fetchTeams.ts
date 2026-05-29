interface OpenfootballTeam {
  name: string;
  continent: string;
  flag_icon?: string;
  fifa_code: string;
  group: string;
  confed: string;
  name_normalised?: string;
}

interface RezarahiminiaTeam {
  fifa_code: string;
  name_en: string;
  flag?: string;
  id: string;
}

export async function fetchOpenfootball(): Promise<OpenfootballTeam[]> {
  const url =
    process.env['TEAMS_SOURCE_OPENFOOTBALL'] ??
    'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch openfootball teams: ${res.status}`);
  return res.json() as Promise<OpenfootballTeam[]>;
}

export async function fetchRezarahiminia(): Promise<RezarahiminiaTeam[]> {
  const url =
    process.env['TEAMS_SOURCE_REZARAHIMINIA'] ??
    'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.teams.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch rezarahiminia teams: ${res.status}`);
  return res.json() as Promise<RezarahiminiaTeam[]>;
}
