import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MatchCard } from './MatchCard';
import type { MatchPrediction } from './MatchCard';

const meta: Meta<typeof MatchCard> = {
  title: 'UI/MatchCard',
  component: MatchCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MatchCard>;

const mexicoVsUsa = {
  homeTeam: {
    name: 'Mexico',
    code: 'MEX',
    flagUrl: 'https://flagcdn.com/w80/mx.png',
  },
  awayTeam: {
    name: 'USA',
    code: 'USA',
    flagUrl: 'https://flagcdn.com/w80/us.png',
  },
  date: 'SAT, JUN 15',
  time: '8:00 PM',
  timezone: 'GMT-5',
  venue: "AT&T Stadium, Dallas",
  competition: 'Group A • Matchday 1',
};

export const Upcoming: Story = {
  args: {
    ...mexicoVsUsa,
    status: 'upcoming',
    prediction: '1',
  },
};

export const NoPrediction: Story = {
  args: {
    ...mexicoVsUsa,
    status: 'upcoming',
    prediction: null,
  },
};

export const Live: Story = {
  args: {
    ...mexicoVsUsa,
    status: 'live',
  },
};

export const Finished: Story = {
  args: {
    ...mexicoVsUsa,
    status: 'finished',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [prediction, setPrediction] = useState<MatchPrediction>('1');
    return (
      <MatchCard
        {...args}
        prediction={prediction}
        onPredictionChange={setPrediction}
      />
    );
  },
  args: {
    ...mexicoVsUsa,
    status: 'upcoming',
  },
};

