"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldSwitchShorthand } from "@/components/core/FormFieldSwitchShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MasterCategory } from "@/generated/prisma/client";
import { ADMIN_DeleteMasterCategorys, ADMIN_UpdateMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, PenIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const AdminMasterCategoryColumns: ColumnDef<MasterCategory & { subCategory: { name: string, id: string }[] }>[] = [
    {
        accessorKey: "edit",
        header: "",
        cell: ({ row }) => {
            return <div className="space-x-2">
                <MasterCategoryEditBtn data={row.original} />
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
        accessorKey: "type",
        header: "نوع دسته بندی",
        cell: ({ row }) => {
            let farsiName = ""
            let style = ""

            switch (row.original.type) {
                case "FRAME":
                    farsiName = "فریم"
                    style = "bg-cyan-500/20 text-cyan-600 font-semibold px-1.5 py-1 border-2 rounded-md w-fit"
                    break;

                case "LENS":
                    farsiName = "عدسی"
                    style = "bg-emerald-500/20 text-emerald-600 font-semibold px-1.5 py-1 border-2 rounded-md w-fit"
                    break;

                case "OTHER":
                    farsiName = "سایر"
                    style = "bg-amber-500/20 text-amber-600 font-semibold px-1.5 py-1 border-2 rounded-md w-fit"
                    break;

                default:
                    farsiName = "-سایر-"
                    style = "bg-amber-500/20 text-amber-600 font-semibold px-1.5 py-1 border-2 rounded-md w-fit"
                    break;
            }
            return <div className={style}>{farsiName}</div>
        }
    },
    {
        accessorKey: "active",
        header: "فعال",
        cell: ({ row }) => {
            return <div className={row.original.active ? "stroke-emerald-500" : "stroke-red-500"}>
                {
                    row.original.active
                        ?
                        <Check stroke="inherit" />
                        :
                        <XIcon stroke="inherit" />
                }
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
                <MasterCategoryDeleteBtn data={row.original} />
            </div>
        }
    },
]

function MasterCategoryDeleteBtn({ data }: { data: MasterCategory & { subCategory: { name: string, id: string }[] } }) {
    const [inputV, setInputV] = useState("")
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)

    const [open, setOpen] = useState(false)

    const hasAttachedCategorys = data.subCategory.length > 0

    async function onDelete() {
        try {
            if (disabled || hasAttachedCategorys) {
                toast.add({
                    title: "این دسته بندی شامل زیرمجموعه است و قابل حذف نیست",
                    type: "warning"
                })
                return
            }

            setLoading(true)

            await ADMIN_DeleteMasterCategorys(data.id)

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
        {
            hasAttachedCategorys
                ?
                <Tooltip>
                    <TooltipTrigger className={buttonVariants({ variant: "default" })}>
                        <TrashIcon />
                    </TooltipTrigger>

                    <TooltipContent className="bg-amber-500/20 text-amber-500 font-semibold border-amber-500/40 border-2 w-fit px-3 py-1 rounded-md text-xs mb-3">
                        این دسته بندی شامل زیرمجموعه است و قابل حذف نیست
                    </TooltipContent>
                </Tooltip>
                :
                <AlertDialogTrigger className={buttonVariants({ variant: "destructive" })}>
                    <TrashIcon />
                </AlertDialogTrigger>
        }

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

            <div>
                {hasAttachedCategorys && <div className="bg-amber-500/20 text-amber-500 font-semibold border-amber-500/40 border-2 w-fit px-3 py-1 rounded-md text-sm mb-3">
                    این دسته بندی شامل زیرمجموعه است و قابل حذف نیست
                </div>}

                <div className="space-x-3 mt-3">
                    <Button onClick={onDelete} disabled={loading || disabled || hasAttachedCategorys} variant={"destructive"}>
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
    active: z.boolean()
})

function MasterCategoryEditBtn({ data }: { data: MasterCategory }) {

    const { handleSubmit, formState, control } = useForm({
        resolver: zodResolver(editSchema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            name: data.name,
            active: data.active
        }
    })

    const [open, setOpen] = useState(false)

    const onSubmit = handleSubmit(async values => {
        try {
            await ADMIN_UpdateMasterCategorys(data.id, values.name, values.active)

            toast.add({
                title: "دسته بندی بروزرسانی شد",
                type: "success"
            })

            setOpen(false)
        } catch (err) {
            toast.add({
                title: "خطا در بروزرسانی",
                type: "error"
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

                    <FormFieldSwitchShorthand
                        control={control}
                        name="active"
                        label="فعال"
                        disabled={formState.isSubmitting}
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