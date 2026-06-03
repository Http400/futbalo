import { Box, Divider, Stack, Typography } from "@mui/material";
import StadiumOutlinedIcon from "@mui/icons-material/StadiumOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

interface MatchVenueInfoProps {
    venue: string;
    competition: string;
}

export function MatchVenueInfo({ venue, competition }: MatchVenueInfoProps) {
    return (
        // <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, mb: 1 }}>
        <Stack>
            <Stack direction="row" spacing={1}>
                <StadiumOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    {venue}
                </Typography>
            </Stack>

            {/* <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <StadiumOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    {venue}
                </Typography>
            </Box> */}
            {/* <Divider orientation="vertical" flexItem /> */}
            <Stack direction="row" spacing={1}>
                <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    {competition}
                </Typography>
            </Stack>
        </Stack>
        // </Box>
    );
}
