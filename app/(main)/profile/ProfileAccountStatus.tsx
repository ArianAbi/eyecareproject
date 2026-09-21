import { UserVerifyType } from "@/generated/prisma/enums";
import { CheckCircle, Hourglass, OctagonAlert, PenIcon } from "lucide-react";

export default function ProfileAccountStatus({ accountStatus }: { accountStatus: UserVerifyType }) {
    if (accountStatus == 'WAITING_FOR_APPROVAL') {
        return <div className="col-span-full ">
            <div className="bg-amber-500/30 border-2 p-3 border-amber-500/60 rounded-md text-xs font-semibold w-fit flex items-center gap-2 stroke-amber-100">
                <Hourglass stroke="inherit" />
                <span className="text-xs">
                    در انتظار تایید حساب. شکیبا باشید
                </span>
            </div>
        </div>
    }

    if (accountStatus == 'REJECTED') {
        return <div className="col-span-full ">
            <div className="bg-red-500/30 border-2 p-3 border-red-500/60 rounded-md text-xs font-semibold w-fit flex items-center gap-2 stroke-red-100">
                <OctagonAlert stroke="inherit" />
                <span className="text-xs">
                    اکانت رد شد. با پشتیبانی در ارتباط باشید
                </span>
            </div>
        </div>
    }

    if (accountStatus == 'UNVERIFIED') {
        return <div className="col-span-full ">
            <div className="bg-cyan-500/30 border-2 p-3 border-cyan-500/60 rounded-md text-xs font-semibold w-fit flex items-center gap-2 stroke-cyan-100">
                <PenIcon stroke="inherit" />
                <span className="text-xs">
                    اطلاعات زیر را پر کنید تا در اسرع وقت حساب شما بازبینی شود
                </span>
            </div>
        </div>
    }

    if (accountStatus == 'VERIFIED') {
        return <div className="col-span-full ">
            <div className="bg-emerald-500/30 border-2 p-3 border-emerald-500/60 rounded-md text-xs font-semibold w-fit flex items-center gap-2 stroke-emerald-100">
                <CheckCircle stroke="inherit" />
                <div className="flex flex-col gap-1">
                    <span className="text-xs">
                        تایید شده
                    </span>
                    <span className="text-xs">
                        اگر مایل به تغییر اطلاعات حساب هستید با پشتیبانی در ارتباط باشید
                    </span>
                </div>
            </div>
        </div>
    }
}