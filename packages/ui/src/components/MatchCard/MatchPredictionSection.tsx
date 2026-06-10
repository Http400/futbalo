import { Divider, Stack, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { MatchPrediction, MatchTeam } from "./types";
import { PredictionButton } from "./PredictionButton";

interface MatchPredictionSectionProps {
    homeTeam: MatchTeam;
    awayTeam: MatchTeam;
    prediction: MatchPrediction;
    onPredictionChange?: ((prediction: MatchPrediction) => void) | undefined;
}

export function MatchPredictionSection({
    homeTeam,
    awayTeam,
    prediction,
    onPredictionChange,
}: MatchPredictionSectionProps) {
    return (
        <>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1}>

                <Typography variant="body2">
                    Your prediction
                    <Tooltip title="You can change your prediction before the match starts">

                        <InfoOutlinedIcon sx={{ ml: 0.25, fontSize: 14, color: "text.secondary" }} />
                    </Tooltip>
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                    <PredictionButton
                        badge="1"
                        label={homeTeam.name}
                        selected={prediction === "1"}
                        onClick={() => onPredictionChange?.("1")}
                    />
                    <PredictionButton
                        badge="X"
                        label="Draw"
                        selected={prediction === "X"}
                        onClick={() => onPredictionChange?.("X")}
                    />
                    <PredictionButton
                        badge="2"
                        label={awayTeam.name}
                        selected={prediction === "2"}
                        onClick={() => onPredictionChange?.("2")}
                    />
                </Stack>
            </Stack>
        </>

    );
}
