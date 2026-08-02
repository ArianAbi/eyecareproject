"use client"

import { FormFieldSelectShorthand } from "@/components/core/FormFieldSelectShorthand";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { MasterCategory } from "@/generated/prisma/client";
import { parseActionError } from "@/lib/action-error";
import { ADMIN_CreateMasterCategoryAction } from "@/lib/actions/admin.masterCategory.actions";
import { ADMIN_CreateProductCategoryAction } from "@/lib/actions/admin.productCategory.actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod"

export default function CreateProductBtn({ masterCategorys }: { masterCategorys: MasterCategory[] }) {
    const schema = z.object({
        name: z.string().min(3, { error: "نام حداقل 3 حرف باید باشد" }),
        description: z.string().min(3, { error: "توضیحات حداقل 3 حرف باید باشد" }),
        masterCategoryId: z.string({ error: "زیرمجموعه الزامیست" }).min(1, { error: "زیرمجموعه الزامیست" })
    })

    const { control, handleSubmit, formState } = useForm({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            name: "",
            description: "",
            masterCategoryId: ""
        }
    })

    const onSubmit = handleSubmit(async values => {
        const data = new FormData()
        data.append("name", values.name)
        data.append("description", values.description)
        data.append("masterCategoryId", values.masterCategoryId)

        try {
            await ADMIN_CreateProductCategoryAction(data)

            setAlertOpen(false)

            toast.add({
                title: "دسته بندی محصول اضافه شد",
                type: "success",
            })
        } catch (err) {
            const { error } = parseActionError(err)

            if (error) {
                toast.add({
                    title: "خطا",
                    description: error,
                    type: "error"
                })
            }
            else {
                console.log(err);
                toast.add({
                    title: "unknown error, check console"
                })
            }
        }
    })

    const [alertOpen, setAlertOpen] = useState(false)

    return <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogTrigger render={
            <Button>
                <span>
                    افزودن دسته بندی محصول
                </span>
                <Plus />
            </Button>
        } />

        <AlertDialogContent>
            {/* <LoadingOverlay /> */}

            <AlertDialogHeader>
                <AlertDialogTitle>افزودن دسته بندی محصول</AlertDialogTitle>
            </AlertDialogHeader>

            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-2">
                <FormFieldShorthand
                    control={control}
                    placeholder="نام دسته بندی"
                    label="نام دسته بندی"
                    name="name"
                    disabled={formState.isSubmitting}
                />

                <FormFieldSelectShorthand
                    control={control}
                    name="masterCategoryId"
                    placeholder="انتخاب زیرمجموعه"
                    label="زیرمجموعه"
                    options={masterCategorys.map(o => ({ label: o.name, value: o.id }))}
                />

                <div className="col-span-full">
                    <FormFieldShorthand
                        control={control}
                        placeholder="توضیحات دسته بندی"
                        label="توضیحات دسته بندی"
                        name="description"
                        as="textarea"
                        disabled={formState.isSubmitting}
                    />
                </div>

                <div className="mt-4 space-x-2 col-span-full">
                    <Button disabled={!formState.isValid || formState.isSubmitting} variant={"secondary"} type="submit">
                        <span>
                            ساخت
                        </span>
                        {formState.isSubmitting && <Spinner />}
                    </Button>

                    <AlertDialogCancel disabled={formState.isSubmitting} className={buttonVariants({ variant: "outline" })}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </form>
        </AlertDialogContent>
    </AlertDialog>
}