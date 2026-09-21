export type RowActionStatus = "idle" | "pending" | "success" | "error"

export interface DataTableMeta<TData> {
  isBulkActionPending: boolean
  getRowStatus: (rowId: string) => RowActionStatus
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData> extends DataTableMeta<TData> { }
}