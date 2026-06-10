import { Stack, Typography } from "@mui/material";

interface MatchDateTimeProps {
    date: string;
    time: string;
    timezone: string;
}

export function MatchDateTime({ date, time }: MatchDateTimeProps) {
    return (
        <Stack>
            <Typography
                variant="caption"
            >
                {date}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {time}
                </Typography>
        </Stack>
    );
}
