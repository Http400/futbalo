import { Box, CardActions, Divider, Stack, Tooltip, Typography } from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
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
    // return (
    //     <>
    //         <Divider sx={{ mx: 2 }} />
    //         <CardActions sx={{ px: 2, py: 1.5, flexDirection: "column", alignItems: "stretch", gap: 1 }}>
    //             <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    //                 <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, minWidth: 140 }}>
    //                     <GpsFixedIcon sx={{ fontSize: 18, color: "text.primary" }} />
    //                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
    //                         Your prediction
    //                     </Typography>
    //                 </Box>
    // <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
    //     <PredictionButton
    //         badge="1"
    //         label={homeTeam.name}
    //         selected={prediction === "1"}
    //         onClick={() => onPredictionChange?.("1")}
    //     />
    //     <PredictionButton
    //         badge="X"
    //         label="Draw"
    //         selected={prediction === "X"}
    //         onClick={() => onPredictionChange?.("X")}
    //     />
    //     <PredictionButton
    //         badge="2"
    //         label={awayTeam.name}
    //         selected={prediction === "2"}
    //         onClick={() => onPredictionChange?.("2")}
    //     />
    // </Stack>
    //             </Box>
    //             <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, justifyContent: "center" }}>
    //                 <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
    //                 <Typography variant="caption" color="text.secondary">
    //                     You can change your prediction before the match starts
    //                 </Typography>
    //             </Box>
    //         </CardActions>
    //     </>
    // );

    return (
        <>
            <Divider />
            <Stack sx={{mt:1}} spacing={1}>

                <Typography variant="body2">
                    Your prediction 
                    <Tooltip title="You can change your prediction before the match starts">
 
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
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
