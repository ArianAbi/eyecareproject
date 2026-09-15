// lib/searchParams.ts

type ParamValue = string | number | boolean;

/**
 * Returns a new query string with the given param set/added,
 * preserving all other existing params.
 */
export function setSearchParam(
    currentParams: string | URLSearchParams,
    key: string,
    value: ParamValue
): string {
    const params = new URLSearchParams(currentParams.toString());
    params.set(key, String(value));
    return params.toString();
}

/**
 * Set multiple params at once, preserving all other existing params.
 */
export function setSearchParams(
    currentParams: string | URLSearchParams,
    updates: Record<string, ParamValue | undefined | null>
): string {
    const params = new URLSearchParams(currentParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            params.delete(key);
        } else {
            params.set(key, String(value));
        }
    });
    return params.toString();
}

/**
 * Get a single param value. Returns null if not present.
 */
export function getSearchParam(
    currentParams: string | URLSearchParams,
    key: string
): string | null {
    const params = new URLSearchParams(currentParams.toString());
    return params.get(key);
}

/**
 * Get all values for a param (for multi-value params like ?tag=a&tag=b).
 */
export function getAllSearchParams(
    currentParams: string | URLSearchParams,
    key: string
): string[] {
    const params = new URLSearchParams(currentParams.toString());
    return params.getAll(key);
}

/**
 * Returns a new query string with the given param removed,
 * preserving all other existing params.
 */
export function deleteSearchParam(
    currentParams: string | URLSearchParams,
    key: string
): string {
    const params = new URLSearchParams(currentParams.toString());
    params.delete(key);
    return params.toString();
}

/**
 * Delete multiple params at once.
 */
export function deleteSearchParams(
    currentParams: string | URLSearchParams,
    keys: string[]
): string {
    const params = new URLSearchParams(currentParams.toString());
    keys.forEach((key) => params.delete(key));
    return params.toString();
}