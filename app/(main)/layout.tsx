import { CustomSidebar, UserSidebarData } from "@/components/core/CustomSidebar";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
    <div className="relative">
      <SidebarProvider>
        <CustomSidebar
          data={UserSidebarData}
          footer
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
  </>
    ;
}