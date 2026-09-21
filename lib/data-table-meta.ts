export type RowActionStatus = "idle" | "pending" | "success" | "error"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    isBulkActionPending: boolean
    getRowStatus: (rowId: string, row?: TData) => RowActionStatus
  }
}
