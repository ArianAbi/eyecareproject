"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldSwitchShorthand } from "@/components/core/FormFieldSwitchShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { MasterCategory } from "@/generated/prisma/client";
import { ADMIN_DeleteMasterCategorys, ADMIN_UpdateMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, PenIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const AdminMasterCategoryColumns: ColumnDef<MasterCategory>[] = [
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

function MasterCategoryDeleteBtn({ data }: { data: MasterCategory }) {
    const [inputV, setInputV] = useState("")
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(true)

    const [open, setOpen] = useState(false)

    const validationPhrase = "delete-this-category"

    async function onDelete() {
        try {
            if (disabled || inputV !== validationPhrase) {
                toast.add({
                    title: "متن تایپ شده صحیح نیست",
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
                        این عملیات قابل برگشت نیست و تمامی زیرمجوعه ها شامل محصولات رو هم حذف میکند
                    </span>
                </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="felx flex-col gap-2">
                <div>
                    <Label className="text-xs">متن زیر را بنویسید</Label>
                    <div className="text-xs bg-amber-400/30 border border-amber-500 text-amber-600 font-semibold px-2 py-1 rounded-md my-2 w-fit">{validationPhrase}</div>
                    <Input
                        placeholder={validationPhrase}
                        value={inputV}
                        onChange={e => {
                            setInputV(e.target.value)

                            if (e.target.value === validationPhrase) {
                                setDisabled(false)
                            } else {
                                setDisabled(true)
                            }
                        }}
                    />
                </div>

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

            <div className="felx flex-col gap-2">
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