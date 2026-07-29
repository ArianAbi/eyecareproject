import { AdminSidebarData, CustomSidebar } from "@/components/core/CustomSidebar";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="relative">
                <SidebarProvider>
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
                </SidebarProvider>
            </div>
        </>
    )
}