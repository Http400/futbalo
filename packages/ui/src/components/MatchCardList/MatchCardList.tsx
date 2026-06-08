import { Stack, Pagination, Typography } from "@mui/material";
import { useState } from "react";
import { MatchCard, type MatchCardProps } from "../MatchCard";

export interface MatchCardListProps {
    items: MatchCardProps[];
    pageSize?: number;
    emptyMessage?: string;
    /** When set, bypasses internal page state — consumer drives the current page. */
    controlledPage?: number;
    /** Total number of pages from the server. Required when controlledPage is set. */
    totalPages?: number;
    /** Called when the user clicks a page in controlled mode. */
    onPageChange?: (page: number) => void;
}

export function MatchCardList({
    items,
    pageSize = 5,
    emptyMessage = "No matches found",
    controlledPage,
    totalPages,
    onPageChange,
}: MatchCardListProps) {
    const [internalPage, setInternalPage] = useState(1);

    const isControlled = controlledPage !== undefined;
    const currentPage = isControlled ? controlledPage : internalPage;
    const pageCount = isControlled ? (totalPages ?? 1) : Math.ceil(items.length / pageSize);
    const displayItems = isControlled ? items : items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
        if (isControlled) {
            onPageChange?.(value);
        } else {
            setInternalPage(value);
        }
    }

    if (items.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                {emptyMessage}
            </Typography>
        );
    }

    return (
        <Stack spacing={2}>
            <Stack spacing={2}>
                {displayItems.map((item, index) => (
                    <MatchCard key={index} {...item} />
                ))}
            </Stack>
            {pageCount > 1 && (
                <Pagination
                    count={pageCount}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    sx={{ alignSelf: "center" }}
                />
            )}
        </Stack>
    );
}
