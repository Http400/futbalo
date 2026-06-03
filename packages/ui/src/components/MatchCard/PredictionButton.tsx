import { Avatar, Box, Button, Typography } from "@mui/material";

interface PredictionButtonProps {
    label: string;
    badge: string;
    selected: boolean;
    onClick: () => void;
}

export function PredictionButton({ label, badge, selected, onClick }: PredictionButtonProps) {
    return (
        <Button variant="outlined" size="small" color='info' sx={{flex: 1}} onClick={onClick} disabled>
            {label}
        </Button>
        // <Box
        //     component="button"
        //     onClick={onClick}
        //     sx={{
        //         display: "flex",
        //         alignItems: "center",
        //         gap: 1.5,
        //         px: 2,
        //         py: 1.25,
        //         flex: 1,
        //         border: "1.5px solid",
        //         borderColor: selected ? "success.main" : "divider",
        //         borderRadius: 2,
        //         bgcolor: "background.paper",
        //         cursor: "pointer",
        //         transition: "border-color 0.2s",
        //         "&:hover": {
        //             borderColor: selected ? "success.main" : "text.secondary",
        //         },
        //     }}
        // >
        //     <Box
        //         sx={{
        //             width: 32,
        //             height: 32,
        //             borderRadius: "50%",
        //             bgcolor: selected ? "success.main" : "grey.200",
        //             display: "flex",
        //             alignItems: "center",
        //             justifyContent: "center",
        //             flexShrink: 0,
        //         }}
        //     >
        //         <Typography
        //             variant="body2"
        //             sx={{
        //                 fontWeight: 700,
        //                 color: selected ? "common.white" : "text.secondary",
        //                 lineHeight: 1,
        //             }}
        //         >
        //             {badge}
        //         </Typography>
        //     </Box>
        //     <Typography
        //         variant="body1"
        //         sx={{
        //             fontWeight: selected ? 600 : 400,
        //             color: selected ? "success.main" : "text.primary",
        //         }}
        //     >
        //         {label}
        //     </Typography>
        // </Box>
    );
}
