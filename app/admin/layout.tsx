import { AdminSidebar } from "@/components/core/AdminSidebar";
import { buttonVariants } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react"
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <div className="h-svh w-full grid place-items-center">
                <main>{children}</main>
            </div>
        </SidebarProvider>
    )
}