import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { auth } from "@/lib/Auth";
import LogoutBtn from "../LogoutBtn";
import { SidebarTrigger } from "../ui/sidebar";

export default async function Header({sidebar=false}) {
    const session = await auth()

    return (
        <header className="w-full bg-background border-b-2 flex items-center justify-between px-3 py-4">
            {sidebar && <SidebarTrigger />}
            
            <div className="ms-auto">
            {/* login btns */}
            {!session &&
                <div className="space-x-2">
                    <Link
                        className={buttonVariants({ variant: "default", size: "sm" })}
                        href="/login"
                    >
                        ورود
                    </Link>

                    <Link
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                        href="/signup"
                    >
                        ساخت حساب
                    </Link>
                </div>
            }

            {session &&
                <LogoutBtn />
            }
            </div>
        </header>
    )
}