import { Stack, Typography } from '@mui/material';
import { MatchListItem, type MatchListItemProps } from '../MatchListItem';

export interface MatchListProps {
  items: MatchListItemProps[];
  emptyMessage?: string;
}

export function MatchList({ items, emptyMessage = 'No matches found' }: MatchListProps) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item, index) => (
        <MatchListItem key={index} {...item} />
      ))}
    </Stack>
  );
}
