const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.stadiums.json';
const REZARAHIMINIA_URL =
  'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.stadiums.json';

interface OpenfootballStadiumsResponse {
  name: string;
  stadiums: OpenfootballStadium[];
}

export interface OpenfootballStadium {
  city: string;
  timezone: string;
  cc: string;
  name: string;
  capacity: number;
  coords?: string;
}

export interface RezarahiminiaStadium {
  id: string;
  name_en: string;
  fifa_name: string;
  city_en: string;
  country_en: string;
  capacity: number;
  region: string;
}

export async function fetchOpenfootballStadiums(): Promise<OpenfootballStadium[]> {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`Failed to fetch openfootball stadiums: ${res.status}`);
  const data = (await res.json()) as OpenfootballStadiumsResponse;
  return data.stadiums;
}

export async function fetchRezarahiminiaStadiums(): Promise<RezarahiminiaStadium[]> {
  const res = await fetch(REZARAHIMINIA_URL);
  if (!res.ok) throw new Error(`Failed to fetch rezarahiminia stadiums: ${res.status}`);
  return res.json() as Promise<RezarahiminiaStadium[]>;
}
