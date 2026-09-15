// hooks/useSearchParamsUtil.ts
'use client'

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    setSearchParams,
    deleteSearchParams,
    getSearchParam,
    getAllSearchParams,
} from "@/lib/search-params";

export function useSearchParamsUtil() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const get = useCallback(
        (key: string) => getSearchParam(searchParams, key),
        [searchParams]
    );

    const getAll = useCallback(
        (key: string) => getAllSearchParams(searchParams, key),
        [searchParams]
    );

    const set = useCallback(
        (key: string, value: string | number | boolean) => {
            const query = setSearchParams(searchParams, { [key]: value });
            router.push(`${pathname}?${query}`);
        },
        [router, pathname, searchParams]
    );

    const setMany = useCallback(
        (updates: Record<string, string | number | boolean | undefined | null>) => {
            const query = setSearchParams(searchParams, updates);
            router.push(`${pathname}?${query}`);
        },
        [router, pathname, searchParams]
    );

    const remove = useCallback(
        (key: string) => {
            const query = deleteSearchParams(searchParams, [key]);
            router.push(query ? `${pathname}?${query}` : pathname);
        },
        [router, pathname, searchParams]
    );

    const removeMany = useCallback(
        (keys: string[]) => {
            const query = deleteSearchParams(searchParams, keys);
            router.push(query ? `${pathname}?${query}` : pathname);
        },
        [router, pathname, searchParams]
    );

    return { get, getAll, set, setMany, remove, removeMany };
}