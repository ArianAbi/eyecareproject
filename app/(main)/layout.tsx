import AccountVerifyNotification from "@/components/AccountVerifyNotification";
import { CustomSidebar, UserSidebarData } from "@/components/core/CustomSidebar";
import Footer from "@/components/core/Footer";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";
import { AlertTriangle, CircleQuestionMarkIcon } from "lucide-react";
import Link from "next/link";

export default async function AuthLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<any>
}) {
  const _params = await params

  console.log("params", _params);

  const session = await auth()
  const isAdmin = session && session.user ?
    await prisma.user.findUnique({
      where: {
        id: session?.user.id
      },
      select: {
        admin: true
      }
    })
    : false

  const accountStatus = (await prisma.user.findUnique({
    where: {
      id: session?.user.id
    },
    select: {
      userStatus: true
    }
  }))?.userStatus

  return <>
    <div className="relative min-h-svh">
      <SidebarProvider>
        <CustomSidebar
          data={UserSidebarData}
          admin={isAdmin ? isAdmin.admin : false}
          footer
          header={
            <>
              ICN
            </>
          }
        />
        <div className="w-full flex flex-col">
          <Header sidebar />

          {accountStatus !== undefined && accountStatus != 'VERIFIED' &&
            <AccountVerifyNotification accountStatus={accountStatus} />
          }

          <main>{children}</main>
          <Footer />
        </div>
      </SidebarProvider >
    </div >
  </>
    ;
}