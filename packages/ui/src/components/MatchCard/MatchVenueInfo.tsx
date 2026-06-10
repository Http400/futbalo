import { Stack, Typography } from "@mui/material";
import StadiumOutlinedIcon from "@mui/icons-material/StadiumOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

interface MatchVenueInfoProps {
    venue: string;
    competition: string;
}

export function MatchVenueInfo({ venue, competition }: MatchVenueInfoProps) {
    return (
        <Stack direction="row" sx={{ flex: 1, justifyContent: "space-between"}}>
            <Stack direction="row" spacing={1}>
                <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    {competition}
                </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
                <StadiumOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                    {venue}
                </Typography>
            </Stack>
        </Stack>
    );
}
