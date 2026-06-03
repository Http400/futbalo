import { Stack, Pagination, Typography } from "@mui/material";
import { useState } from "react";
import { MatchCard, type MatchCardProps } from "../MatchCard";

export interface MatchCardListProps {
    items: MatchCardProps[];
    pageSize?: number;
    emptyMessage?: string;
}

export function MatchCardList({
    items,
    pageSize = 5,
    emptyMessage = "No matches found",
}: MatchCardListProps) {
    const [page, setPage] = useState(1);

    if (items.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                {emptyMessage}
            </Typography>
        );
    }

    const pageCount = Math.ceil(items.length / pageSize);
    const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

    function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
        setPage(value);
    }

    return (
        <Stack spacing={2}>
            <Stack spacing={2}>
                {currentItems.map((item, index) => (
                    <MatchCard key={index} {...item} />
                ))}
            </Stack>
            {pageCount > 1 && (
                <Pagination
                    count={pageCount}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    sx={{ alignSelf: "center" }}
                />
            )}
        </Stack>
    );
}
