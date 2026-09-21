"use client"

import { CategoryDialog } from "@/components/core/CategoryDialog"
import { FormFieldComboboxShorthand } from "@/components/core/FormFieldComboboxShorthand"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { Prisma, Tags, UserVerifyType } from "@/generated/prisma/client"
import { lensFilter } from "@/lib/lens-filter"
import { AllLensRanges, NegativeLensRanges } from "@/lib/lens-range"
import { LensProductType } from "@/types/lens-product"
import { CartItemProductItemType, OrderProductItemWithStatus } from "@/types/order"
import { zodResolver } from "@hookform/resolvers/zod"
import { Copy, CornerUpLeft, Handbag, SprayCan, TowelRack, Trash, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import CartOrderItem from "./CartOrderItem"
import { AddItemToCartAction } from "@/lib/actions/cart.actions"
import { ADMIN_AddItemToCartAction } from "@/lib/actions/admin.cart.actions"
import SubmitOrderBtn from "./SubmitOrderBtn"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function GlasslensOrderPage({ categorys, accountStatus, userCredit, tags, cartItems, adminUserId }: {
    adminUserId?: string,
    categorys: Prisma.SubCategoryGetPayload<{
        include: {
            products: {
                include: {
                    lens: true,
                    tags: true
                }
            }
        }
    }>[],
    userCredit: number | undefined,
    accountStatus: UserVerifyType | undefined,
    tags: Tags[],
    cartItems: Prisma.CartItemGetPayload<{
        include: {
            product: true
        }
    }>[]
}) {

    const mappedItems: OrderProductItemWithStatus[] = cartItems.map(item => ({
        ...item.product,
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        // ...spread whatever other product fields OrderProductItemType expects

        od: {
            sph: item.odSph,
            cyl: item.odCyl,
            aux: item.odAux,
        },
        os: {
            sph: item.osSph,
            cyl: item.osCyl,
            aux: item.osAux,
        },
        odOnly: item.odOnly,
        rawOrCut: item.rawOrCut === "CUT",

        // status-tracking fields your extended type adds
        tempId: item.id,          // reuse the real DB id as tempId, since it's already stable+unique
        cartStatus: "success",    // it's already persisted, so it's not "pending"
        cartItemId: item.id,
    }))

    const [orderProductItems, setOrderProductItems] = useState<OrderProductItemWithStatus[]>(mappedItems)
    const [pendingChanges, setPendingChanges] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const onCartPendingChange = (pending: boolean) => setPendingChanges(count => count + (pending ? 1 : -1))

    const accountVeified = accountStatus ? accountStatus == 'VERIFIED' ? true : false : false

    const orderSumPrice = orderProductItems.reduce((acc, curr) => {
        const price = curr.odOnly ? curr.price / 2 : curr.price
        return acc += price
    }, 0)

    useEffect(() => {
        setOrderProductItems(mappedItems)
    }, [cartItems])

    const [odOnly, setOdOnly] = useState(false)

    const schema = z.object({
        od: z.object({
            sph: z.string(),
            cyl: z.string(),
            aux: z.string()
        }),
        os: z.object({
            sph: z.string(),
            cyl: z.string(),
            aux: z.string()
        })
    })

    const [userNote, setUserNote] = useState("")

    const { control, watch, setValue } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            od: {
                sph: "0.00",
                cyl: "0.00",
                aux: "0"
            },
            os: {
                sph: "0.00",
                cyl: "0.00",
                aux: "0"
            }
        }
    })


    async function AddItemToOrder(item: CartItemProductItemType) {
        item.rawOrCut = false

        const tempId = crypto.randomUUID()
        const newItem: OrderProductItemWithStatus = { ...item, tempId, cartStatus: "pending" }

        setOrderProductItems(prev => [newItem, ...prev])

        try {
            const result = await (adminUserId ? ADMIN_AddItemToCartAction(adminUserId, item) : AddItemToCartAction(item))

            if (!result.success || !result.cartItem) {
                toast.add({ type: "error", title: "سفارش افزوده نشد", description: result.error })
                setOrderProductItems(prev =>
                    prev.map(i => i.tempId === tempId ? { ...i, cartStatus: "error" } : i)
                )
                return
            }

            setOrderProductItems(prev => prev.map(i => i.tempId === tempId
                ? { ...i, cartStatus: "success", cartItemId: result.cartItem.id }
                : i))
        } catch {
            toast.add({ type: "error", title: "سفارش افزوده نشد" })
            setOrderProductItems(prev =>
                prev.map(i => i.tempId === tempId ? { ...i, cartStatus: "error" } : i)
            )
        }
    }

    return (
        <fieldset disabled={submitting} className="border p-3 max-lg:p-2 space-y-2 rounded-md min-w-0">
            <section className="flex flex-col-reverse lg:flex-row gap-2 p-2 border border-white/50 border-dashed rounded-lg w-full items-end justify-between ">

                {/* categorys */}
                <div className="flex w-full gap-2 justify-between xl:basis-3/5 max-lg:grid max-lg:grid-cols-2 max-lg:[&>button]:w-full max-lg:[&>button]:min-h-10">
                    {
                        categorys.map(cate => {
                            return <CategoryDialog
                                key={cate.id}
                                category={cate}
                                AddToOrder={(orderItem) => {
                                    AddItemToOrder(orderItem)
                                }}
                                range={
                                    {
                                        od: watch().od,
                                        os: watch().os,
                                        odOnly
                                    }
                                }
                            />
                        })
                    }
                </div>

                {/* inputs */}
                <div className="xl:basis-2/5 max-lg:w-full max-lg:min-w-0 max-lg:overflow-x-auto">
                    <table dir="ltr" className="max-lg:w-full max-lg:[&_td]:px-0.5 max-lg:[&_input]:min-w-0 max-lg:[&_input]:px-1">
                        <thead>
                            <tr>
                                <th style={{ minWidth: "0px" }}></th>
                                <th style={{ minWidth: "50px" }}></th>
                                <th>SPH</th>
                                <th>CYL</th>
                                <th>AUX</th>
                                <th style={{ minWidth: "0px" }}></th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* OD */}
                            <tr>
                                <td className="p-2">
                                </td>

                                <td className="p-2">OD </td>

                                {/* Sph */}
                                <td className="px-1">
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="od.sph"
                                        label=""
                                        ltr
                                        emptySnapValue="0.00"
                                        options={AllLensRanges.map(range => {
                                            const rangeText = `${range.sign}${range.value}`
                                            return { label: rangeText, value: rangeText }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                {/* Cyl */}
                                <td className="px-1">
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="od.cyl"
                                        label=""
                                        ltr
                                        emptySnapValue="0.00"
                                        options={NegativeLensRanges.map(range => {
                                            const rangeText = `${range.sign}${range.value}`
                                            return { label: rangeText, value: rangeText }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                {/* AUX */}
                                <td className={`px-1 ${parseFloat(watch().od.cyl) == 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="od.aux"
                                        placeholder=""
                                        label=""
                                        ltr
                                        emptySnapValue="0"
                                        options={Array(180).fill("S").map((_, _index) => {
                                            return { label: `${_index + 1}`, value: `${_index + 1}` }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                <td className={`${odOnly ? 'pointer-events-none opacity-50' : ''}`}>
                                    <CornerUpLeft size={18} />
                                </td>
                            </tr>

                            {/* OS */}
                            <tr>
                                <td>
                                    <Checkbox
                                        checked={!odOnly}
                                        onClick={() => setOdOnly(prev => !prev)}
                                    />
                                </td>

                                <td className={`p-2 ${odOnly ? 'pointer-events-none opacity-50' : ''}`}>OS </td>

                                {/* Sph */}
                                <td className={`px-1 ${odOnly ? 'pointer-events-none opacity-50' : ''}`}>
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="os.sph"
                                        label=""
                                        ltr
                                        emptySnapValue="0.00"
                                        options={AllLensRanges.map(range => {
                                            const rangeText = `${range.sign}${range.value}`
                                            return { label: rangeText, value: rangeText }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                {/* Cyl */}
                                <td className={`px-1 ${odOnly ? 'pointer-events-none opacity-50' : ''}`}>
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="os.cyl"
                                        label=""
                                        ltr
                                        emptySnapValue="0.00"
                                        options={NegativeLensRanges.map(range => {
                                            const rangeText = `${range.sign}${range.value}`
                                            return { label: rangeText, value: rangeText }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                {/* AUX */}
                                <td className={`px-1 ${parseFloat(watch().os.cyl) == 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <FormFieldComboboxShorthand
                                        control={control}
                                        name="os.aux"
                                        placeholder=""
                                        label=""
                                        ltr
                                        emptySnapValue="0"
                                        options={Array(180).fill("S").map((_, _index) => {
                                            return { label: `${_index + 1}`, value: `${_index + 1}` }
                                        })}
                                        filter={lensFilter}
                                    />
                                </td>

                                <td className={`${odOnly ? 'pointer-events-none opacity-50' : ''}`}>
                                    <Button size="icon"
                                        variant={"outline"}
                                        onClick={() => {
                                            setValue('os.sph', watch().od.sph)
                                            setValue('os.cyl', watch().od.cyl)
                                            setValue('os.aux', watch().od.aux)
                                        }}
                                    >
                                        <Copy />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </section>

            <section className="grid grid-cols-10 max-lg:grid-cols-1 gap-2">
                {/* orders list */}
                <div className="col-span-7 max-lg:col-span-1 max-lg:min-w-0 min-h-72 rounded-lg p-2 border border-dashed border-white/50 ">
                    <p className="mb-2 text-xs text-muted-foreground lg:hidden">برای دیدن تمام ستون‌ها، جدول را به چپ و راست بکشید.</p>
                    <Table className="max-lg:min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>عنوان</TableHead>
                                <TableHead className="text-center">آکس</TableHead>
                                <TableHead className="text-center">نمره</TableHead>
                                <TableHead className="text-center">قیمت</TableHead>
                                <TableHead className="text-center">تراش</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {
                                orderProductItems.map((order, _i) => {
                                    return <CartOrderItem
                                        key={order.tempId}
                                        indexInList={_i}
                                        listNumber={orderProductItems.length - _i}
                                        orderItem={order}
                                        updateOrderList={setOrderProductItems}
                                        adminUserId={adminUserId}
                                        onPendingChange={onCartPendingChange}
                                    />
                                })
                            }
                        </TableBody>
                    </Table>
                </div>

                {/* order summery */}
                <div className="col-span-3 max-lg:col-span-1 max-lg:min-w-0 rounded-lg p-2 max-h-fit sticky top-2 max-lg:static border border-dashed border-white/50 flex flex-col">
                    <table className="text-sm">
                        <thead>
                            <tr>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* Bags */}
                            <tr>
                                <td className="py-2">
                                    ساکدستی
                                </td>
                                <td className="py-2">
                                    <span className="flex items-center">
                                        <span>
                                            {orderProductItems.reduce((acc, curr) => {
                                                if (curr.includesBag) {
                                                    acc += 1
                                                }

                                                return acc
                                            }, 0)}
                                        </span>

                                        <span>
                                            <XIcon size={12} />
                                        </span>

                                        <span>
                                            <Handbag size={18} />
                                        </span>
                                    </span>
                                </td>
                            </tr>

                            {/* Spray */}
                            <tr>
                                <td className="py-2">
                                    اسپری
                                </td>
                                <td className="py-2">
                                    <span className="flex items-center">
                                        <span>
                                            {orderProductItems.reduce((acc, curr) => {
                                                if (curr.includesCleaningSpray) {
                                                    acc += 1
                                                }

                                                return acc
                                            }, 0)}
                                        </span>
                                        <span>
                                            <XIcon size={12} />
                                        </span>

                                        <span>
                                            <SprayCan size={18} />
                                        </span>
                                    </span>
                                </td>
                            </tr>

                            {/* Cloth */}
                            <tr>
                                <td className="py-2">
                                    دستمال
                                </td>
                                <td className="py-2">
                                    <span className="flex items-center">
                                        <span>
                                            {orderProductItems.reduce((acc, curr) => {
                                                if (curr.includesCleaningCloth) {
                                                    acc += 1
                                                }

                                                return acc
                                            }, 0)}
                                        </span>
                                        <span>
                                            <XIcon size={12} />
                                        </span>

                                        <span>
                                            <TowelRack size={18} />
                                        </span>
                                    </span>
                                </td>
                            </tr>

                            {/* order count */}
                            <tr>
                                <td className="pt-4">تعداد سفارش</td>
                                <td className="pt-4">{orderProductItems.length}</td>
                            </tr>

                            {/* order price */}
                            <tr>
                                <td className="py-2">جمع قیمت</td>
                                <td className="py-2">
                                    <span>
                                        {orderProductItems.reduce((acc, cur) => {
                                            const _price = cur.odOnly ? cur.price / 2 : cur.price
                                            return acc += _price
                                        }, 0).toLocaleString()}
                                    </span>

                                    <span className="text-xs font-semibold text-emerald-500"> تومان</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <Dialog>
                        <DialogTrigger className={cn('mb-2', buttonVariants({ variant: "boldOutline" }))}>
                            {
                                userNote == "" ?
                                    <span>
                                        افزودن توضیحات
                                    </span>
                                    :
                                    <span>
                                        تصحیح توضیحات
                                    </span>
                            }
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    توضیحات سفارش
                                </DialogTitle>
                            </DialogHeader>

                            <Textarea
                                maxLength={2000}
                                value={userNote}
                                onChange={e => setUserNote(e.target.value)}
                            />

                            <DialogClose className={buttonVariants({ variant: 'default' })}>
                                تایید
                            </DialogClose>
                        </DialogContent>
                    </Dialog>

                    {!accountVeified &&
                        <>
                            <SubmitOrderBtn
                                customerNote={userNote}
                                disabled
                            />
                            <span className="text-amber-400 text-center text-sm">{adminUserId ? 'حساب کاربر انتخاب‌شده تایید نشده' : 'حساب شما تایید نشده'}</span>
                        </>
                    }

                    {accountVeified &&
                        <>
                            <SubmitOrderBtn
                                customerNote={userNote}
                                adminUserId={adminUserId}
                                onPendingChange={setSubmitting}
                                disabled={pendingChanges > 0 || orderProductItems.length <= 0 || orderProductItems.some(item => item.cartStatus !== "success")}
                            />

                            {(userCredit ?? 0) < orderSumPrice &&
                                <span className="text-amber-400 text-center text-sm">{adminUserId ? 'اعتبار کاربر انتخاب‌شده کافی نیست' : 'اعتبار حساب شما کافی نیست'}</span>
                            }
                        </>
                    }
                </div>
            </section>


        </fieldset>
    )
}
