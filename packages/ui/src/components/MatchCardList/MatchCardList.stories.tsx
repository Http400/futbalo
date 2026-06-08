import type { Meta, StoryObj } from '@storybook/react';
import { MatchCardList } from './MatchCardList';

const meta: Meta<typeof MatchCardList> = {
  title: 'UI/MatchCardList',
  component: MatchCardList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MatchCardList>;

const baseMatch = {
  homeTeam: { name: 'Mexico', code: 'MEX', flagUrl: 'https://flagcdn.com/w80/mx.png' },
  awayTeam: { name: 'USA', code: 'USA', flagUrl: 'https://flagcdn.com/w80/us.png' },
  date: 'SAT, JUN 15',
  time: '8:00 PM',
  timezone: 'GMT-5',
  venue: "Levi's Stadium, San Francisco Bay Area (Santa Clara)",
  competition: 'Group A • Matchday 1',
  status: 'upcoming' as const,
};

const matches = [
  { ...baseMatch, homeTeam: { name: 'Mexico', code: 'MEX', flagUrl: 'https://flagcdn.com/w80/mx.png' }, awayTeam: { name: 'USA', code: 'USA', flagUrl: 'https://flagcdn.com/w80/us.png' } },
  { ...baseMatch, homeTeam: { name: 'Brazil', code: 'BRA', flagUrl: 'https://flagcdn.com/w80/br.png' }, awayTeam: { name: 'Argentina', code: 'ARG', flagUrl: 'https://flagcdn.com/w80/ar.png' }, status: 'finished' as const },
  { ...baseMatch, homeTeam: { name: 'France', code: 'FRA', flagUrl: 'https://flagcdn.com/w80/fr.png' }, awayTeam: { name: 'Germany', code: 'GER', flagUrl: 'https://flagcdn.com/w80/de.png' }, status: 'live' as const },
  { ...baseMatch, homeTeam: { name: 'Spain', code: 'ESP', flagUrl: 'https://flagcdn.com/w80/es.png' }, awayTeam: { name: 'Portugal', code: 'POR', flagUrl: 'https://flagcdn.com/w80/pt.png' } },
  { ...baseMatch, homeTeam: { name: 'England', code: 'ENG', flagUrl: 'https://flagcdn.com/w80/gb-eng.png' }, awayTeam: { name: 'Italy', code: 'ITA', flagUrl: 'https://flagcdn.com/w80/it.png' } },
  { ...baseMatch, homeTeam: { name: 'Netherlands', code: 'NED', flagUrl: 'https://flagcdn.com/w80/nl.png' }, awayTeam: { name: 'Belgium', code: 'BEL', flagUrl: 'https://flagcdn.com/w80/be.png' } },
  { ...baseMatch, homeTeam: { name: 'Croatia', code: 'CRO', flagUrl: 'https://flagcdn.com/w80/hr.png' }, awayTeam: { name: 'Serbia', code: 'SRB', flagUrl: 'https://flagcdn.com/w80/rs.png' } },
];

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const WithPagination: Story = {
  args: {
    items: matches,
    pageSize: 3,
  },
};

export const SinglePage: Story = {
  args: {
    items: matches.slice(0, 3),
    pageSize: 5,
  },
};
