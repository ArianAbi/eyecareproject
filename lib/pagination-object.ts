export const paginationSkipNumber = 10 as const

export const PaginationObjectDB = (page?: number, skipNumber?: number) => {
    return {
        take: skipNumber ?? paginationSkipNumber,
        skip: page ? (Math.max(1, page) - 1) * (skipNumber ?? paginationSkipNumber) : 0,
    }
}