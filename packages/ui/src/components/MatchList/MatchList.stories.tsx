import type { Meta, StoryObj } from '@storybook/react';
import { MatchList } from './MatchList';

const meta: Meta<typeof MatchList> = {
  title: 'UI/MatchList',
  component: MatchList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MatchList>;

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const WithMatches: Story = {
  args: {
    items: [
      {
        homeTeam: { name: 'Mexico', flagIcon: '🇲🇽' },
        awayTeam: { name: 'South Africa', flagIcon: '🇿🇦' },
        date: '2026-06-10',
      },
      {
        homeTeam: { name: 'Brazil', flagIcon: '🇧🇷' },
        awayTeam: { name: 'Argentina', flagIcon: '🇦🇷' },
        date: '2026-06-01',
        score: '2 - 1',
      },
    ],
  },
};
