import { auth } from "@/lib/Auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "مدیریت", robots: { index: false, follow: false } }
import { AdminSidebarData, CustomSidebar } from "@/components/core/CustomSidebar";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OrderCountProvider } from "./AdminProviders";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } })
    if (!account?.admin) redirect('/')
    return (
        <>
            <div className="relative">
                <SidebarProvider>
                    <OrderCountProvider>
                        <CustomSidebar
                            data={AdminSidebarData}
                            footer
                            header={
                                <>
                                    ICN
                                </>
                            }
                        />
                        <div className="w-full">
                            <div className="py-1 px-2 bg-yellow-200 border-b-2 border-amber-500 text-amber-600 font-semibold">مدیریت</div>
                            <Header sidebar />
                            <main className="p-3">{children}</main>
                        </div>
                    </OrderCountProvider>
                </SidebarProvider>
            </div>
        </>
    )
}