import { Box, Typography } from "@mui/material";
import type { MatchTeam } from "./types";
import { TeamDisplay } from "./TeamDisplay";

interface MatchTeamsRowProps {
    homeTeam: MatchTeam;
    awayTeam: MatchTeam;
}

export function MatchTeamsRow({ homeTeam, awayTeam }: MatchTeamsRowProps) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1.5 }}>
            <TeamDisplay team={homeTeam} />

            <Box
                sx={{
                    px: 1.5,
                    py: 0.75,
                    bgcolor: "grey.100",
                    borderRadius: 1.5,
                    flexShrink: 0,
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    VS
                </Typography>
            </Box>

            <TeamDisplay team={awayTeam} align="right" />
        </Box>
    );
}
