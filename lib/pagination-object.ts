export const paginationSkipNumber = 10 as const

export const PaginationObjectDB = (page?: number | string, skipNumber?: number) => {
    const parsed = Number(page)
    const safePage = Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 1000000 ? parsed : 1
    return {
        take: skipNumber ?? paginationSkipNumber,
        skip: (safePage - 1) * (skipNumber ?? paginationSkipNumber),
    }
}
