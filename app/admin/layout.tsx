import { AdminSidebarData, CustomSidebar } from "@/components/core/CustomSidebar";
import Header from "@/components/core/Header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative">
            <SidebarProvider>
                <CustomSidebar
                    data={AdminSidebarData}
                    header={
                        <>
                            ICN
                        </>
                    }
                />
                <div className="w-full">
                    <Header sidebar />
                    <main>{children}</main>
                </div>
            </SidebarProvider>
        </div>
    )
}