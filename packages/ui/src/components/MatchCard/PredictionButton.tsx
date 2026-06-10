import { Button } from "@mui/material";

interface PredictionButtonProps {
    label: string;
    badge: string;
    selected: boolean;
    onClick: () => void;
}

export function PredictionButton({ label, onClick }: PredictionButtonProps) {
    return (
        <Button variant="outlined" size="small" color='info' sx={{flex: 1}} onClick={onClick} disabled>
            {label}
        </Button>
    );
}
