"use client"

import { ReactNode, useState } from "react"
import {
  ColumnDef,
  RowSelectionState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RowActionStatus } from "@/lib/data-table-meta"

export interface BulkActionContext<TData> {
  selectedRows: TData[]
  selectedCount: number
  isPending: boolean
  disabled: boolean
  trigger: (value: string) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableRowSelection?: boolean
  onBulkAction?: (row: TData, value: string) => Promise<void>
  /** Fires once, after every row's promise has settled (resolved or rejected). */
  onBulkActionFinish?: (results: { row: TData; status: RowActionStatus }[]) => void
  renderBulkAction?: (ctx: BulkActionContext<TData>) => ReactNode
}

// How long a finished check/X stays up before the row reverts to a normal checkbox.
const STATUS_RESET_DELAY = 3000

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  onBulkAction,
  onBulkActionFinish,
  renderBulkAction,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isPending, setIsPending] = useState(false)
  const [rowStatus, setRowStatus] = useState<Record<string, RowActionStatus>>({})

  const columnVisibility: VisibilityState = { select: enableRowSelection }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    meta: {
      isBulkActionPending: isPending,
      getRowStatus: (rowId: any) => rowStatus[rowId] ?? "idle",
    },
  })

  const selectedTableRows = table.getSelectedRowModel().rows
  const selectedRows = selectedTableRows.map((row) => row.original)

  async function trigger(value: string) {
    if (!onBulkAction || selectedTableRows.length === 0) return

    setIsPending(true)
    setRowStatus(Object.fromEntries(selectedTableRows.map((row) => [row.id, "pending"])))

    const results = await Promise.allSettled(
      selectedTableRows.map(async (row) => {
        const outcome: RowActionStatus = await onBulkAction(row.original, value)
          .then(() => "success" as const)
          .catch(() => "error" as const)

        setRowStatus((prev) => ({ ...prev, [row.id]: outcome }))
        if (outcome === "success") row.toggleSelected(false)

        setTimeout(() => {
          setRowStatus((prev) =>
            prev[row.id] === outcome ? { ...prev, [row.id]: "idle" } : prev
          )
        }, STATUS_RESET_DELAY)

        return { row: row.original, status: outcome }
      })
    )

    setIsPending(false)
    onBulkActionFinish?.(results.map((r) => (r as PromiseFulfilledResult<{ row: TData; status: RowActionStatus }>).value))
  }

  const showToolbar = enableRowSelection && renderBulkAction

  return (
    <div className="space-y-2">
      {showToolbar && (
        <div className="flex items-center gap-2">
          {renderBulkAction({
            selectedRows,
            selectedCount: selectedRows.length,
            isPending,
            disabled: selectedRows.length === 0 || isPending,
            trigger,
          })}
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} مورد انتخاب شده
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className="h-24 text-center"
                >
                  لیست خالی
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}