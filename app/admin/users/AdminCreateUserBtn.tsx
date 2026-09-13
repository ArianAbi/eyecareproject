"use client"

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

export default function AdminCreateUserBtn(){

    return <>
    <AlertDialog>
        <AlertDialogTrigger className={buttonVariants({variant:'green'})}>
            ساخت حساب کاربری
        </AlertDialogTrigger>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    ساخت حساب کاربری
                </AlertDialogTitle>
            </AlertDialogHeader>

            <div>
                
            </div>
        </AlertDialogContent>
    </AlertDialog>
    </>
}