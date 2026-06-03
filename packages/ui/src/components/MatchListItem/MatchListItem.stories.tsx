import type { Meta, StoryObj } from '@storybook/react';
import { MatchListItem } from './MatchListItem';

const meta: Meta<typeof MatchListItem> = {
  title: 'UI/MatchListItem',
  component: MatchListItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MatchListItem>;

export const Upcoming: Story = {
  args: {
    homeTeam: { name: 'Mexico', flagIcon: '🇲🇽' },
    awayTeam: { name: 'South Africa', flagIcon: '🇿🇦' },
    date: '2026-06-10',
  },
};

export const Finished: Story = {
  args: {
    homeTeam: { name: 'Mexico', flagIcon: '🇲🇽' },
    awayTeam: { name: 'South Africa', flagIcon: '🇿🇦' },
    date: '2026-06-01',
    score: '2 - 1',
  },
};

