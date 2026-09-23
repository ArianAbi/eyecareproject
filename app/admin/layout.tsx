import { auth } from "@/lib/Auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "مدیریت", robots: { index: false, follow: false } }
import { CustomSidebar } from "@/components/core/CustomSidebar";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ApprovalCountProvider, CreditInvoiceCountProvider, OpenTicketCountProvider, OrderCountProvider } from "./AdminProviders";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } })
    if (!account?.admin) redirect('/')
    const [approvalCount, openTicketCount, creditInvoiceCount] = await Promise.all([
        prisma.user.count({ where: { userStatus: 'WAITING_FOR_APPROVAL' } }),
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.invoice.count({ where: { status: 'WAITING_FOR_APPORVAL', paymentType: 'CREDIT' } }),
    ])
    return (
        <>
            <div className="relative">
                <SidebarProvider>
                    <OrderCountProvider>
                        <ApprovalCountProvider count={approvalCount}>
                        <OpenTicketCountProvider count={openTicketCount}>
                        <CreditInvoiceCountProvider count={creditInvoiceCount}>
                        <CustomSidebar
                            admin
                            menu="admin"
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
                        </CreditInvoiceCountProvider>
                        </OpenTicketCountProvider>
                        </ApprovalCountProvider>
                    </OrderCountProvider>
                </SidebarProvider>
            </div>
        </>
    )
}
