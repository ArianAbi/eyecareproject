"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { TableCell, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { DeleteItemFromCartAction, UpdateCartItemRawOrCutAction } from "@/lib/actions/cart.actions"
import type { OrderProductItemWithStatus } from "@/types/order"
import { Trash } from "lucide-react"
import { useSession } from "next-auth/react"
import { Dispatch, SetStateAction, useOptimistic, useState, useTransition } from "react"

export default function CartOrderItem({ indexInList, listNumber, orderItem, updateOrderList }: {
    indexInList: number,
    listNumber: number,
    orderItem: OrderProductItemWithStatus,
    updateOrderList: Dispatch<SetStateAction<OrderProductItemWithStatus[]>>,
}) {
    const user = useSession().data?.user

    const [rawOrCut, setRawOrCut] = useState(orderItem.rawOrCut)
    const [loading, setLoading] = useState(false)

    async function ToggleRawOrCut(value: boolean) {
        try {
            if(!orderItem.cartItemId) {
                throw new Error("این محصول به سبد خرید اضافه نشده")
            }

            setRawOrCut(value)
            setLoading(true)

            await UpdateCartItemRawOrCutAction(orderItem.cartItemId, value)
        } catch (err) {
            setRawOrCut(!value)
            if (err instanceof Error) {
                toast.add({
                    type: "Error",
                    description: err.message,
                    title: "سفارش بروزرسانی نشد"
                })
            } else {
                toast.add({
                    type: "Error",
                    description: "unkown error",
                    title: "سفارش بروزرسانی نشد"
                })
            }
        } finally {
            setLoading(false)
        }
    }

    return <>
        <TableRow>
            <TableCell className="text-base font-bold">
                {
                    orderItem.cartStatus == 'pending' || loading && <Spinner />
                }
                {
                    orderItem.cartStatus == 'success' && !loading && listNumber
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
                            <span>{orderItem.os.sph}</span>
                            <span> {orderItem.os.cyl}</span>
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
                        checked={rawOrCut}
                        onCheckedChange={ToggleRawOrCut}
                        disabled={loading}
                    />
                </div>

            </TableCell>

            <TableCell>
                {
                    user && user.id &&
                    <RemoveOrderPopover
                        userId={user.id}
                        cartItemId={orderItem.cartItemId}
                        disabled={loading}
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


function RemoveOrderPopover({ userId, cartItemId, onDeleteFromList, disabled = false }: { userId: string, cartItemId: string | undefined, onDeleteFromList: CallableFunction, disabled?: boolean }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function DeleteFromCart() {
        try {
            if (disabled) return

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
        <PopoverTrigger disabled={loading || disabled} className={buttonVariants({ variant: "destructive" })}>
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