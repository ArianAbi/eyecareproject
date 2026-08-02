"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { parseActionError } from "@/lib/action-error";
import { ADMIN_CreateMasterCategoryAction } from "@/lib/actions/admin.masterCategory.actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod"

export default function CreateMasterCategoryBtn() {
    const schema = z.object({
        name: z.string().min(3,{error:"نام حداقل 3 حرف باید باشد"})
    })

    const { control, handleSubmit, formState } = useForm({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues:{
            name:""
        }
    })

    const onSubmit= handleSubmit(async values=>{
        const data = new FormData()
        data.append("name",values.name)

        try{
            await ADMIN_CreateMasterCategoryAction(data)
            
            setAlertOpen(false)

            toast.add({
                title:"دسته بندی اضافه شد",
                type:"success",
            })
        }catch(err){
            const {error} = parseActionError(err)

            if(error){
                toast.add({
                    title:"خطا",
                    description:error,
                    type:"error"
                })
            }
            else{
                console.log(err);
                toast.add({
                    title:"unknown error, check console"
                })
            }
        }
    })

    const [alertOpen,setAlertOpen] = useState(false)

    return <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogTrigger render={
                <Button>
                    <span>
                        افزودن
                    </span>
                    <Plus />
                </Button>
            } />

            <AlertDialogContent>
                {/* <LoadingOverlay /> */}

                <AlertDialogHeader>
                    <AlertDialogTitle>افزودن دسته بندی کلی</AlertDialogTitle>
                </AlertDialogHeader>

                <form onSubmit={onSubmit}>
                    <FormFieldShorthand
                        control={control}
                        placeholder="نام دسته بندی"
                        label="نام دسته بندی"
                        name="name"
                        disabled={formState.isSubmitting}
                    />

                    <div className="mt-4 space-x-2">
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