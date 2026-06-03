import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { MatchStatus } from "./types";

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

interface MatchStatusControlsProps {
    status: MatchStatus;
    onAlertClick?: (() => void) | undefined;
    onMoreClick?: (() => void) | undefined;
}

export function MatchStatusControls({ status, onAlertClick, onMoreClick }: MatchStatusControlsProps) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: 2,
                flexShrink: 0,
            }}
        >
            <Chip
                label={STATUS_LABELS[status]}
                variant="outlined"
                color={STATUS_COLORS[status] as "success" | "error" | "default"}
                size="small"
                sx={{ fontWeight: 600, borderRadius: 5, px: 0.5 }}
            />
            <Tooltip title="Set reminder">
                <IconButton size="small" onClick={onAlertClick}>
                    <NotificationsNoneOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onMoreClick}>
                <MoreVertIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
