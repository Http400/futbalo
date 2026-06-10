import { Card, CardActions, CardContent, Chip, Divider, Stack } from "@mui/material";
import type { MatchPrediction, MatchStatus, MatchTeam } from "./types";
import { MatchDateTime } from "./MatchDateTime";
import { MatchTeamsRow } from "./MatchTeamsRow";
import { MatchVenueInfo } from "./MatchVenueInfo";
import { MatchPredictionSection } from "./MatchPredictionSection";

const STATUS_LABELS: Record<MatchStatus, string> = {
    upcoming: "Upcoming",
    live: "Live",
    finished: "Finished",
};

const STATUS_COLORS: Record<MatchStatus, string> = {
    upcoming: "success",
    live: "error",
    finished: "default",
};

export type { MatchPrediction, MatchStatus, MatchTeam };

export interface MatchCardProps {
    homeTeam: MatchTeam;
    awayTeam: MatchTeam;
    date: string;
    time: string;
    timezone: string;
    venue: string;
    competition: string;
    status: MatchStatus;
    prediction?: MatchPrediction;
    onPredictionChange?: (prediction: MatchPrediction) => void;
    canPredict?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function MatchCard({
    homeTeam,
    awayTeam,
    date,
    time,
    timezone,
    venue,
    competition,
    status,
    prediction = null,
    onPredictionChange,
    canPredict = false,
    onMouseEnter,
    onMouseLeave,
}: MatchCardProps) {

    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <CardContent sx={{ pb: 0 }}>
                <Stack spacing={2}>


                    <Stack direction="row" spacing={2}>
                        <Stack spacing={2}>
                            <Stack direction="row" sx={{ width: 180, justifyContent: "space-between" }}>
                                <div>
                                    <Chip
                                        label={STATUS_LABELS[status]}
                                        variant="outlined"
                                        color={STATUS_COLORS[status] as "success" | "error" | "default"}
                                        size="small"
                                    />
                                </div>
                                <MatchDateTime date={date} time={time} timezone={timezone} />
                            </Stack>
                            
                        </Stack>
                        <Divider orientation="vertical" flexItem sx={{ mr: 2.5 }} />
                        <Stack direction="column" sx={{ flex: 1 }}>
                            <MatchTeamsRow homeTeam={homeTeam} awayTeam={awayTeam} />
                            {canPredict && (
                                <MatchPredictionSection
                                    homeTeam={homeTeam}
                                    awayTeam={awayTeam}
                                    prediction={prediction}
                                    onPredictionChange={onPredictionChange}
                                />
                            )}
                        </Stack>
                    </Stack>
                    <Divider flexItem />
                    
                </Stack>
            </CardContent>
            <CardActions sx={{ px: 2 }}>
                    <MatchVenueInfo venue={venue} competition={competition} />
      </CardActions>
        </Card>
    );
}