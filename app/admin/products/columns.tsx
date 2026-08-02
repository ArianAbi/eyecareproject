"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldSwitchShorthand } from "@/components/core/FormFieldSwitchShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { MasterCategory, Product, SubCategory } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { ADMIN_DeleteMasterCategorys, ADMIN_UpdateMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { ADMIN_DeleteProductCategorys, ADMIN_UpdateProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, PenIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const AdminSubCategoryColumn: ColumnDef<SubCategory&{masterCategory:MasterCategory,products:Product[]}>[] = [
    {
        accessorKey: "edit",
        header: "",
        cell: ({ row }) => {
            return <div className="space-x-2">
                <ProductCategoryEditBtn data={row.original} />
            </div>
        }
    },
    {
        accessorKey: "name",
        header: "نام",
        cell: ({ row }) => {
            return <div>{row.original.name}</div>
        }
    },
    {
        accessorKey: "description",
        header: "توضیحات",
        cell: ({ row }) => {
            return <div>
                description
            </div>
        }
    },
    {
        accessorKey: "masterCategoryId",
        header: "زیرمجموعه",
        cell: ({ row }) => {
            return <div className="bg-gray-500/20 border-2 border-gray-600/20 px-2 py-1 rounded-md w-fit">
                {row.original.masterCategory.name}
            </div>
        }
    },
    {
        accessorKey: "products",
        header: "محصولات متصل",
        cell: ({ row }) => {
            return <div>
                {row.original.products.length}
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
        accessorKey: "delete",
        header: "",
        cell: ({ row }) => {
            return <div className="space-x-2">
                {
                row.original.products.length <= 0
                ? <ProductCategoryDeleteBtn data={row.original} />
            :
            <Button disabled variant={"destructive"}>
                <TrashIcon />
            </Button>
            }
            </div>
        }
    },
]

function ProductCategoryDeleteBtn({ data }: { data: SubCategory & {products:Product[]} }) {
    // const [inputV, setInputV] = useState("")
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const containsProducts = data.products.length > 0

    const [open, setOpen] = useState(false)

    async function onDelete() {
        try {
            if(data.products.length > 0) throw new ActionError({error:"در این دسته بندی محصول هست و قابل حذف نیست"})
            // if (disabled || inputV !== validationPhrase) {
            //     toast.add({
            //         title: "متن تایپ شده صحیح نیست",
            //         type: "warning"
            //     })
            //     return
            // }

            setLoading(true)

            await ADMIN_DeleteProductCategorys(data.id)

            toast.add({
                title: "دسته بندی حذف شد",
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
                        {" " + data.name}
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
                    <Button onClick={onDelete} disabled={containsProducts || loading || disabled} variant={"destructive"}>
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

const editSchema = z.object({
    name: z.string().min(3, { error: "نام حداقل 3 حرف باید باشد" }),
    description: z.string().min(3, { error: "توضیحات حداقل 3 حرف باید باشد" })
})

function ProductCategoryEditBtn({ data }: { data: SubCategory }) {

    const { handleSubmit, formState, control } = useForm({
        resolver: zodResolver(editSchema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            name: data.name,
            description: data.description
        }
    })

    const [open, setOpen] = useState(false)

    const onSubmit = handleSubmit(async values => {
        try {
            await ADMIN_UpdateProductCategorys(data.id,values.name,values.description)

            toast.add({
                title:"دسته بندی بروزرسانی شد",
                type:"success"
            })

            setOpen(false)
        } catch (err) {
            toast.add({
                title:"خطا در بروزرسانی",
                type:"error"
            })
            console.log(err);
            
        }
    })

    return <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger className={buttonVariants({ variant: "edit" })}>
            <PenIcon />
        </AlertDialogTrigger>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    <span>
                        بروزرسانی
                    </span>
                    <span>
                        {" " + data.name}
                    </span>
                </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2">
                <div className="space-y-2">
                    <FormFieldShorthand
                        control={control}
                        name="name"
                        label="نام جدید"
                        placeholder="نام جدید"
                        disabled={formState.isSubmitting}
                    />

                    <FormFieldShorthand
                        control={control}
                        name="description"
                        label="توضیحات جدید"
                        placeholder="توضیحات جدید"
                        disabled={formState.isSubmitting}
                        as="textarea"
                    />
                </div>

                <div className="space-x-3 mt-3">
                    <Button onClick={onSubmit} disabled={formState.isSubmitting} variant={"edit"}>
                        <span>
                            بروزرسانی
                        </span>
                        {formState.isSubmitting && <Spinner />}
                    </Button>

                    <AlertDialogCancel disabled={formState.isSubmitting} variant={"default"}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </div>
        </AlertDialogContent>
    </AlertDialog>
}