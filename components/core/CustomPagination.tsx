'use client'

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { paginationSkipNumber } from "@/lib/pagination-object";

interface CustomPaginationProps {
    total: number;
    pageSize?: number;
    paramKey?: string;
}

export default function CustomPagination({
    total,
    pageSize = paginationSkipNumber,
    paramKey = "page",
}: CustomPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const currentPage = useMemo(() => {
        const raw = Number(searchParams.get(paramKey));
        if (!Number.isSafeInteger(raw) || raw < 1 || raw > 1000000) return 1;
        if (raw > totalPages) return totalPages;
        return raw;
    }, [searchParams, paramKey, totalPages]);

    const goToPage = useCallback(
        (page: number) => {
            if (page < 1 || page > totalPages || page === currentPage) return;

            const params = new URLSearchParams(searchParams.toString());
            params.set(paramKey, String(page));

            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams, paramKey, totalPages, currentPage]
    );

    // Build the list of page numbers/ellipsis markers to render
    const pageItems = useMemo(() => {
        const items: (number | "ellipsis-start" | "ellipsis-end")[] = [];
        const siblingCount = 1; // pages shown on each side of current

        const firstPage = 1;
        const lastPage = totalPages;

        const leftSibling = Math.max(currentPage - siblingCount, firstPage);
        const rightSibling = Math.min(currentPage + siblingCount, lastPage);

        const showLeftEllipsis = leftSibling > firstPage + 1;
        const showRightEllipsis = rightSibling < lastPage - 1;

        items.push(firstPage);

        if (showLeftEllipsis) {
            items.push("ellipsis-start");
        } else {
            for (let p = firstPage + 1; p < leftSibling; p++) items.push(p);
        }

        for (let p = leftSibling; p <= rightSibling; p++) {
            if (p !== firstPage && p !== lastPage) items.push(p);
        }

        if (showRightEllipsis) {
            items.push("ellipsis-end");
        } else {
            for (let p = rightSibling + 1; p < lastPage; p++) items.push(p);
        }

        if (lastPage !== firstPage) items.push(lastPage);

        return items;
    }, [currentPage, totalPages]);

    return (
        <Pagination>
            <PaginationContent className="mt-2">
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        text="قبلی"
                        onClick={(e) => {
                            e.preventDefault();
                            goToPage(currentPage - 1);
                        }}
                        aria-disabled={currentPage === 1}
                        className={
                            currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : undefined
                        }
                    />
                </PaginationItem>

                {pageItems.map((item, idx) =>
                    item === "ellipsis-start" || item === "ellipsis-end" ? (
                        <PaginationItem key={`${item}-${idx}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={item}>
                            <PaginationLink
                                href="#"
                                isActive={item === currentPage}
                                onClick={(e) => {
                                    e.preventDefault();
                                    goToPage(item);
                                }}
                            >
                                {item}
                            </PaginationLink>
                        </PaginationItem>
                    )
                )}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        text="بعدی"
                        onClick={(e) => {
                            e.preventDefault();
                            goToPage(currentPage + 1);
                        }}
                        aria-disabled={currentPage === totalPages}
                        className={
                            currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : undefined
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}