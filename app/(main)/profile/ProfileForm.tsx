"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { Prisma } from "@/generated/prisma/client"
import { SaveProfileInfoAction } from "@/lib/actions/profile.action"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"



export default function ProfileForm({ profile }: {
    profile: Prisma.UserGetPayload<{
        select: {
            id: true,
            number: true,
            managementName: true,
            nationalCode: true,
            address: true,
            userStatus: true,
            username: true
        }
    }>
}) {
    const [managementName, setManagementName] = useState(profile.managementName)
    const [address, setAddress] = useState(profile.address)
    const [nationalCode, setNationalCode] = useState(profile.nationalCode)

    const [pending, startTransition] = useTransition()

    const valid = managementName && address && nationalCode.length == 10

    const formStatusDisabled = !(profile.userStatus === 'VERIFIED' || profile.userStatus === 'REJECTED')

    const nationalCodeError = nationalCode.length > 0 && nationalCode.length !== 10 ?
        "کدملی صحیح نیست" : ""

    const onlyDigits = /^\d*$/

    const router = useRouter()


    async function SaveProfile() {
        startTransition(async () => {
            try {
                if (nationalCode.length !== 10) {
                    toast.add({
                        type: "error",
                        title: "فرمت کدملی وارد شده صحیح نیست"
                    })
                    return
                }

                await SaveProfileInfoAction({
                    address: address,
                    managementName: managementName,
                    nationalCode: nationalCode
                })

                router.refresh()
            } catch (err) {
                toast.add({
                    title: "پروفایل ذخیره نشد",
                    ...(err instanceof Error ? { description: err.message } : {})
                })
            }
        })
    }

    return <>

        {/* managemant name */}
        <div className="space-y-2">
            <Label>
                نام مدیریت
            </Label>
            <Input
                placeholder="نام مدیریت فروشگاه"
                disabled={formStatusDisabled || pending}
                value={managementName}
                onChange={e => setManagementName(e.target.value)}
            />
        </div>

        {/* managemant name */}
        <div className="space-y-2">
            <Label>
                کدملی
            </Label>
            <Input
                disabled={formStatusDisabled || pending}
                value={nationalCode}
                placeholder="کدملی"
                onChange={e => {
                    if (onlyDigits.test(e.target.value)) {
                        setNationalCode(e.target.value)
                    }
                }}
            />
            <span className="text-red-400 font-semibold rounded-lg px-2 text-xs">
                {nationalCodeError}
            </span>
        </div>

        {/* address */}
        <div className="space-y-2 col-span-full">
            <Label>
                آدرس
            </Label>
            <Textarea
                disabled={formStatusDisabled || pending}
                value={address}
                onChange={e => setAddress(e.target.value)}
            />
        </div>


        {
            // Save Button
            (profile.userStatus == 'UNVERIFIED' || profile.userStatus == 'REJECTED') &&
            <Button
                className={'col-span-full w-fit mt-2 px-5'}
                disabled={!valid || pending}
                size={'lg'}
                onClick={SaveProfile}
                variant={'green'}
            >
                {pending && <Spinner />}
                <span>
                    ذخیره اطلاعات
                </span>
            </Button>
        }


    </>
}