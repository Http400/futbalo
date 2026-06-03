import { Box, Typography } from "@mui/material";
import type { MatchTeam } from "./types";

interface TeamDisplayProps {
    team: MatchTeam;
    align?: "left" | "right";
}

export function TeamDisplay({ team, align = "left" }: TeamDisplayProps) {
    const isRight = align === "right";
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexDirection: isRight ? "row-reverse" : "row",
                flex: 1,
            }}
        >
            <Box
                component="img"
                src={team.flagUrl}
                alt={team.name}
                sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                }}
            />
            <Box sx={{ textAlign: isRight ? "right" : "left" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {team.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {team.code}
                </Typography>
            </Box>
        </Box>
    );
}
