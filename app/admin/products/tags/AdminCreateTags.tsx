"use client"

import { colorOptionsType, ColorSelect, colorSelectMap } from "@/components/core/FormFieldColorSelectShorthand"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ADMIN_CreateTag } from "@/lib/actions/admin.tag.action"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function AdminCreateTagBtn() {

    const [tag, setTag] = useState("")
    const [color, setColor] = useState<colorOptionsType["value"]>("gray")

    const [open, setOpen] = useState(false)

    const [loading, setLoading] = useState(false)

    async function onSubmit() {
        try {
            setLoading(true)

            if (!tag) {
                toast.add({
                    type: "Error",
                    title: "Tag is empty"
                })

                return
            }
            await ADMIN_CreateTag(tag, color)

            setTag("")

            toast.add({
                type: "Success",
                title: "Tag Created"
            })

            setOpen(false)
        } catch (err) {
            if (err instanceof Error) {
                toast.add({
                    type: "Error",
                    title: "Failed to create Tag",
                    description: `${err.message}`
                })

                return
            }
            toast.add({
                type: "Error",
                title: "Failed to create Tag",
                description: "unknown error"
            })
        }
        finally {
            setLoading(false)
        }
    }

    return <>
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
                افزودن تگ
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>افزودن تگ</AlertDialogTitle>
                </AlertDialogHeader>

                <div>

                    <div className="space-y-2">
                        <Label>عنوان تگ</Label>
                        <Input value={tag} onChange={e => setTag(e.target.value)} placeholder="عنوان تگ" />
                    </div>

                    <div className="space-y-2 mt-3">
                        <Label>رنگ</Label>

                        <ColorSelect 
                        value={color}
                        onChange={e=>setColor(e as colorOptionsType['value'])}
                        />

                        {/* <Select defaultValue="gray" value={color} onValueChange={e=>setColor(e as colorOptionsType['value'])}>
                            <SelectTrigger className="w-full">
                                <div className={cn("rounded-full size-4",colorSelectMap[color])}></div>

                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {colorOptions.map((color, _i) => {
                                    return <SelectItem
                                        value={color.value}
                                        className={`flex px-2 justify-between w-full`}
                                        key={_i}
                                    >
                                        <div className={`rounded-full size-4 ${colorSelectMap[color.value]}`}></div>

                                        <span>{color.label}</span>
                                    </SelectItem>
                                })}
                            </SelectContent>
                        </Select> */}
                    </div>
                </div>

                <div>
                    <Button onClick={onSubmit} disabled={loading || !tag}>
                        <span>
                            ساخت
                        </span>
                        {loading && <Spinner />}
                    </Button>

                    <AlertDialogCancel disabled={loading}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    </>
}