import { Box, Grid, GridProps, Typography } from '@mui/material';

interface Team {
  name: string;
  flagIcon: string;
}

export interface MatchListItemProps {
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  score?: string;
}

const Team = ({ name, flagIcon, ...gridProps }: Team & GridProps) => (
  <Grid container spacing={1} sx={{
    justifyContent: "center",
    alignItems: "center",
  }} {...gridProps}>
    {flagIcon}
    <Typography variant="body1" sx={{ flex: 1, textAlign: 'right' }}>
      {name}
    </Typography>
  </Grid>
);

export function MatchListItem({ homeTeam, awayTeam, date, score }: MatchListItemProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        // justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Team {...homeTeam} />

      <Box sx={{ px: 2, textAlign: 'center', minWidth: 80 }}>
        {score != null ? (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {score}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            vs
          </Typography>
        )}
      </Box>

      <Team direction="row-reverse" {...awayTeam}  />
    </Box>
  );
}
