"use client"

import { useMemo, useState } from "react"
import { ArrowUp, ArrowDown, ArrowUpDown, CheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { ActionData } from "@/types/actions"
import { ADMIN_GetSingleOrder } from "@/lib/actions/admin.orders.action"
import { colorOptionsType, colorSelectMap } from "./core/FormFieldColorSelectShorthand"

type SortKey = "name" | "category" | "odOnly" | "rawOrCut" | "price"
type SortDirection = "asc" | "desc" | null

// Reusable clickable header: click cycles asc -> desc -> unsorted.
function SortableHeader({
    label,
    sortKey,
    activeKey,
    direction,
    onSort,
    className,
}: {
    label: string
    sortKey: SortKey
    activeKey: SortKey | null
    direction: SortDirection
    onSort: (key: SortKey) => void
    className?: string
}) {
    const isActive = activeKey === sortKey
    return (
        <Button
            variant="ghost"
            onClick={() => onSort(sortKey)}
            className={cn("h-8 px-2 -mx-2 gap-1 font-medium", className)}
        >
            {label}
            {isActive && direction === "asc" && <ArrowUp className="size-3.5" />}
            {isActive && direction === "desc" && <ArrowDown className="size-3.5" />}
            {!isActive && <ArrowUpDown className="size-3.5 opacity-40" />}
        </Button>
    )
}

export function OrderTable({
    data
}: {
    data: NonNullable<ActionData<typeof ADMIN_GetSingleOrder>>['orderItems']
}) {
    const [sortKey, setSortKey] = useState<SortKey | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)

    function handleSort(key: SortKey) {
        if (sortKey !== key) {
            setSortKey(key)
            setSortDirection("asc")
        } else if (sortDirection === "asc") {
            setSortDirection("desc")
        } else {
            setSortKey(null)
            setSortDirection(null)
        }
    }

    const sortedItems = useMemo(() => {
        if (!sortKey || !sortDirection) return data
        const dir = sortDirection === "asc" ? 1 : -1

        return [...data].sort((a, b) => {
            switch (sortKey) {
                case "name":
                    return a.product.name.localeCompare(b.product.name, "fa") * dir
                case "category":
                    return (
                        a.product.categoryRel.name.localeCompare(b.product.categoryRel.name, "fa") * dir
                    )
                case "odOnly":
                    return (Number(a.odOnly) - Number(b.odOnly)) * dir
                case "rawOrCut":
                    return a.rawOrCut.localeCompare(b.rawOrCut, "fa") * dir
                case "price":
                    return (a.purchasedPrice - b.purchasedPrice) * dir
                default:
                    return 0
            }
        })
    }, [data, sortKey, sortDirection])

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        <SortableHeader
                            label="نام محصول"
                            sortKey="name"
                            activeKey={sortKey}
                            direction={sortDirection}
                            onSort={handleSort}
                        />
                    </TableHead>

                    <TableHead className="text-center">
                        <SortableHeader
                            label="دسته بندی"
                            sortKey="category"
                            activeKey={sortKey}
                            direction={sortDirection}
                            onSort={handleSort}
                            className="mx-auto"
                        />
                    </TableHead>

                    <TableHead>
                        <SortableHeader
                            label="تک چشم"
                            sortKey="odOnly"
                            activeKey={sortKey}
                            direction={sortDirection}
                            onSort={handleSort}
                        />
                    </TableHead>

                    <TableHead>آکس</TableHead>
                    <TableHead>نمره</TableHead>

                    <TableHead>
                        <SortableHeader
                            label="تراش"
                            sortKey="rawOrCut"
                            activeKey={sortKey}
                            direction={sortDirection}
                            onSort={handleSort}
                        />
                    </TableHead>

                    <TableHead>
                        <SortableHeader
                            label="قیمت"
                            sortKey="price"
                            activeKey={sortKey}
                            direction={sortDirection}
                            onSort={handleSort}
                        />
                    </TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {sortedItems.map((item) => {
                    return (
                        <TableRow key={item.id}>
                            <TableCell>
                                {item.product.name}
                            </TableCell>

                            <TableCell>
                                <div className="text-center flex items-center justify-center gap-1">
                                    <div className={cn(
                                        colorSelectMap[item.product.categoryRel.color as colorOptionsType['value']],
                                        'size-3 rounded-full'
                                    )}></div>
                                    {item.product.categoryRel.name}
                                </div>
                            </TableCell>

                            <TableCell>
                                {item.odOnly
                                    ?
                                    <CheckIcon className="stroke-emerald-500" stroke="inherit" />
                                    :
                                    <XIcon className="stroke-red-500" stroke="inherit" />
                                }
                            </TableCell>

                            <TableCell>
                                {/* AUX */}
                                <div className="flex flex-col items-start">
                                    <span style={{ direction: "ltr" }}>
                                        <span>OD : </span>
                                        {parseFloat(item.odCyl) < 0 ?
                                            <span>
                                                {item.odAux} deg
                                            </span>
                                            :
                                            <span>
                                                ندارد
                                            </span>
                                        }
                                    </span>

                                    {!item.odOnly &&
                                        <span style={{ direction: "ltr" }}>
                                            <span>OS : </span>

                                            {parseFloat(item.osCyl) < 0 ?
                                                <span>
                                                    {item.osAux} deg
                                                </span>
                                                :
                                                <span>
                                                    ندارد
                                                </span>
                                            }
                                        </span>
                                    }
                                </div>
                            </TableCell>

                            <TableCell>
                                {/* sph & cyl */}
                                <div className="flex flex-col">
                                    <span>
                                        <span>OD : </span>
                                        <span>{item.odSph}</span>
                                        <span> {item.odCyl}</span>
                                    </span>

                                    {
                                        !item.odOnly &&
                                        <span>
                                            <span>OS : </span>
                                            <span>{item.osSph}</span>
                                            <span> {item.osCyl}</span>
                                        </span>
                                    }
                                </div>
                            </TableCell>

                            <TableCell>
                                {
                                    item.rawOrCut == 'RAW'
                                        ?
                                        <span>ندارد</span>
                                        :
                                        <span className="text-emerald-500">دارد</span>
                                }
                            </TableCell>

                            <TableCell>
                                {item.purchasedPrice.toLocaleString() + " "}
                                <span className="text-xs text-emerald-500 font-semibold">
                                    تومان
                                </span>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}