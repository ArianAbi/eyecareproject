import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { auth } from "@/lib/Auth";
import LogoutBtn from "../LogoutBtn";

export default async function Header() {
    const session = await auth()

    console.log(session);

    return (
        <header className="w-full bg-background border-b-2 flex items-center justify-between px-3 py-4">
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
        </header>
    )
}