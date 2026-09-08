"use client"

import { colorOptionsType, colorSelectMap } from "@/components/core/FormFieldColorSelectShorthand";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldSwitchShorthand } from "@/components/core/FormFieldSwitchShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Lens, Prisma, Product, SubCategory } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { ADMIN_DeleteMasterCategorys, ADMIN_UpdateMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { ADMIN_DeleteProductCategorys, ADMIN_UpdateProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { ADMIN_DeleteProduct } from "@/lib/actions/admin.products.action";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { ArrowRight, BanIcon, Check, Handbag, PenIcon, SprayCan, TowelRack, TrashIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

// export const AdminProductsColumn: ColumnDef<Product & { lens: Lens | null }>[] = [
export const AdminProductsColumn: ColumnDef<Prisma.ProductGetPayload<{
    include: {
        tags: true,
        lens: true
    }
}>>[] = [
        {
            accessorKey: "delete",
            header: "",
            cell: ({ row }) => {
                return <div className="space-x-2">
                    <ProductDeleteBtn product={row.original} lensId={row.original.lens ? row.original.lens.id : null}/>
                </div>
            }
        },
        {
            accessorKey: "edit",
            header: "",
            cell: ({ row }) => {
                return <div className="space-x-2">
                    <Link
                        href={`/admin/products/${row.original.id}`}
                        className={buttonVariants({ variant: "default" })}
                    >
                        Edit
                    </Link>
                </div>
            }
        },
        {
            accessorKey: "tags",
            header: () => {
                return <div className="text-center">
                    تگ ها
                </div>
            },
            cell: ({ row }) => {

                if (row.original.tags.length > 0) {

                    return <div className="flex max-w-28 justify-center flex-wrap gap-1">
                        {
                            row.original.tags.map(tag => {
                                return <div key={tag.id} className={cn(colorSelectMap[tag.color as colorOptionsType['value']], "px-1 py-0.5 rounded-md w-fit text-[10px] font-semibold")}>
                                    {tag.name}
                                </div>
                            })
                        }
                    </div>
                } else {
                    return <div className="w-full text-center text-white/60">
                        بدون تگ
                    </div>
                }
            }
        },
        {
            accessorKey: "name",
            header: "نام محصول",
            cell: ({ row }) => {
                return <div>{row.original.name}</div>
            }
        },
        {
            accessorKey: "type",
            header: "نوع محصول",
            cell: ({ row }) => {
                if (row.original.type == 'LENS') {
                    return <div className="w-fit rounded-md px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500">عدسی</div>
                }
                if (row.original.type == 'FRAME') {
                    return <div className="w-fit rounded-md px-1.5 py-0.5 bg-emerald-500/20 border border-amber-500">فریم</div>
                }
            }
        },
        {
            accessorKey: "packagingInclusion",
            header: () => {
                return <div className="text-center">
                    بسته بندی
                </div>
            },
            cell: ({ row }) => {
                const includesBag = row.original.includesBag
                const includesSpray = row.original.includesCleaningSpray
                const includesCloth = row.original.includesCleaningCloth

                return <div className="w-full text-center flex justify-between gap-1">
                    <div className="relative">
                        {!includesBag && <div className="absolute z-10 stroke-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <BanIcon strokeWidth={2.5} stroke="inherit" />
                        </div>}

                        <Handbag className={`${!includesBag ? 'stroke-gray-200 scale-85' : 'stroke-white'}`} stroke="inherit" />
                    </div>

                    <div className="relative">
                        {!includesCloth && <div className="absolute z-10 stroke-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <BanIcon strokeWidth={2.5} stroke="inherit" />
                        </div>}

                        <TowelRack className={`${!includesCloth ? 'stroke-gray-200 scale-85' : 'stroke-white'}`} stroke="inherit" />
                    </div>

                    <div className="relative">
                        {!includesSpray && <div className="absolute z-10 stroke-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <BanIcon strokeWidth={2.5} stroke="inherit" />
                        </div>}

                        <SprayCan className={`${!includesSpray ? 'stroke-gray-200 scale-85' : 'stroke-white'}`} stroke="inherit" />
                    </div>
                </div>
            }
        },
        // {
        //     accessorKey: "description",
        //     header: "توضیحات",
        //     cell: ({ row }) => {
        //         return <div className="max-w-32 overflow-hidden">
        //             {row.original.description}
        //         </div>
        //     }
        // },
        // {
        //     accessorKey: "",
        //     header: "زیرمجموعه",
        //     cell: ({ row }) => {
        //         return <div className="bg-gray-500/20 border-2 border-gray-600/20 px-2 py-1 rounded-md w-fit">
        //             {row.original.masterCategory.name}
        //         </div>
        //     }
        // },
        {
            accessorKey: "price",
            header: "قیمت",
            cell: ({ row }) => {
                return <div className="flex gap-1">
                    <span>
                        {row.original.price.toLocaleString()}
                    </span>

                    <span className="text-emerald-500 font-semibold">
                        تومان
                    </span>
                </div>
            }
        },
        {
            accessorKey: "createdAt",
            header: "تاریخ ساخت",
            cell: ({ row }) => {
                return <div>
                    {
                        format(row.original.createdAt, "yyyy/MM/dd")
                    }
                </div>
            }
        },
        {
            accessorKey: "",
            header: "محدوده نمره",
            cell: ({ row }) => {
                if (row.original.lens) {
                    return <div>
                        <div>
                            <span>cyl : </span>
                            <span>
                                <span>
                                    {row.original.lens.fromCyl}
                                </span>

                                <span> / </span>

                                <span>
                                    {row.original.lens.toCyl}
                                </span>
                            </span>
                        </div>
                        <div>
                            <span>sph : </span>
                            <span>{row.original.lens.negativeToSph}</span>

                            <span> / </span>

                            <span>{row.original.lens.positivToSph}</span>
                        </div>
                    </div>
                }
            }
        },
    ]

function ProductDeleteBtn({ product ,lensId}: { product: Product ,lensId:string | null}) {
    // const [inputV, setInputV] = useState("")
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)

    const [open, setOpen] = useState(false)

    async function onDelete() {
        try {
            setLoading(true)

            await ADMIN_DeleteProduct(product.id,lensId)

            toast.add({
                title: "محصول حذف شد",
                type: "success"
            })

            setOpen(false)
        } catch (err) {
            toast.add({
                title: "Failed to Delete,check console",
                type: "error"
            })

            console.log(err);
        } finally {
            setLoading(false)
        }
    }

    return <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger className={buttonVariants({ variant: "destructive" })}>
            <TrashIcon />
        </AlertDialogTrigger>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    <span>
                        حذف
                    </span>
                    <span>
                        {" " + product.name}
                    </span>
                </AlertDialogTitle>

                <AlertDialogDescription>
                    <span>
                        این عملیات قابل برگشت نیست
                    </span>
                </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2">
                <div className="space-x-3 mt-3">
                    <Button onClick={onDelete} disabled={loading || disabled} variant={"destructive"}>
                        <span>
                            حذف
                        </span>
                        {loading && <Spinner />}
                    </Button>

                    <AlertDialogCancel variant={"default"}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </div>
        </AlertDialogContent>
    </AlertDialog>
}
