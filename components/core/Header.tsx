import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";

export default function Header(){
    return (
        <header className="w-full bg-background border-b-2 flex items-center justify-between px-3 py-4">
            {/* btns */}
            <div className="space-x-2">
                <Link
                 className={buttonVariants({variant:"default",size:"sm"})}
                 href="/login"
                 >
                    ورود
                </Link>
            
                <Link
                 className={buttonVariants({variant:"secondary",size:"sm"})}
                 href="/signup"
                 >
                    ساخت حساب
                </Link>
            </div>
        </header>
    )
}