"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { TableCell, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { DeleteItemFromCartAction } from "@/lib/actions/cart.actions"
import type { OrderProductItemWithStatus } from "@/types/order"
import { Trash } from "lucide-react"
import { useSession } from "next-auth/react"
import { Dispatch, SetStateAction, useState } from "react"

export default function CartOrderItem({ indexInList, listNumber, orderItem, updateOrderList }: {
    indexInList: number,
    listNumber: number,
    orderItem: OrderProductItemWithStatus,
    updateOrderList: Dispatch<SetStateAction<OrderProductItemWithStatus[]>>,
}) {
    const user = useSession().data?.user

    return <>
        <TableRow>
            <TableCell className="text-base font-bold">
                {
                    orderItem.cartStatus == 'pending' && <Spinner />
                }
                {
                    orderItem.cartStatus == 'success' && listNumber
                }
            </TableCell>
            <TableCell>
                {orderItem.name}
            </TableCell>

            <TableCell >
                <div className="flex flex-col justify-center items-center">

                    <span style={{ direction: "ltr" }}>
                        <span>OD : </span>
                        {parseFloat(orderItem.od.cyl) < 0 ?
                            <span>
                                {orderItem.od.aux} deg
                            </span>
                            :
                            <span>
                                ندارد
                            </span>
                        }
                    </span>

                    {!orderItem.odOnly &&
                        <span style={{ direction: "ltr" }}>
                            <span>OS : </span>

                            {parseFloat(orderItem.os.cyl) < 0 ?
                                <span>
                                    {orderItem.os.aux} deg
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
                <div className="flex flex-col">
                    <span>
                        <span>OD : </span>
                        <span>{orderItem.od.sph}</span>
                        <span> {orderItem.od.cyl}</span>
                    </span>

                    {
                        !orderItem.odOnly &&
                        <span>
                            <span>OS : </span>
                            <span>{orderItem.od.sph}</span>
                            <span> {orderItem.od.cyl}</span>
                        </span>
                    }
                </div>
            </TableCell>

            <TableCell>
                {
                    orderItem.odOnly ?
                        <span>
                            {(orderItem.price / 2).toLocaleString() + " "}
                        </span>
                        :
                        <span>
                            {orderItem.price.toLocaleString() + " "}
                        </span>
                }

                <span className="text-emerald-500 text-xs font-semibold">
                    تومان
                </span>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-1">
                    <Checkbox
                        checked={orderItem.rawOrCut}
                        onCheckedChange={e => {
                            updateOrderList(prev => {
                                const newList = [...prev]
                                newList[indexInList].rawOrCut = e

                                return newList
                            })
                        }}
                    />
                </div>

            </TableCell>

            <TableCell>
                {
                    user && user.id &&
                    <RemoveOrderPopover
                        userId={user.id}
                        cartItemId={orderItem.cartItemId}
                        onDeleteFromList={() => {
                            updateOrderList(prev => {
                                const newList = [...prev]
                                newList.splice(indexInList, 1)

                                return newList
                            })
                        }} />
                }

            </TableCell>
        </TableRow>
    </>
}


function RemoveOrderPopover({ userId, cartItemId, onDeleteFromList }: { userId: string, cartItemId: string | undefined, onDeleteFromList: CallableFunction }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function DeleteFromCart() {
        try {
            setLoading(true)

            if (cartItemId) {
                const data = await DeleteItemFromCartAction(userId, cartItemId)

                onDeleteFromList()
            }

        } catch (err) {
            if (err instanceof Error) {
                toast.add({
                    type: "Error",
                    title: "سفارش از لیست حدف نشد",
                    description: err.message
                })
            }
        } finally {
            setLoading(false)
        }
    }

    return <Popover open={open} onOpenChange={setOpen} >
        <PopoverTrigger disabled={loading} className={buttonVariants({ variant: "destructive" })}>
            {loading ? <Spinner /> : <Trash />}
        </PopoverTrigger>

        <PopoverContent>
            <PopoverHeader>
                آیا از حذف سفارش مطمعن هستید؟
            </PopoverHeader>

            <div>
                <Button variant={'destructive'} onClick={() => {
                    DeleteFromCart()
                    setOpen(false)
                }}>
                    حذف
                </Button>

                <Button variant={'outline'} onClick={() => {
                    setOpen(false)
                }}>
                    لغو
                </Button>
            </div>
        </PopoverContent>
    </Popover>
}