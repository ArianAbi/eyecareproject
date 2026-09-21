import AccountVerifyNotification from "@/components/AccountVerifyNotification";
import { CustomSidebar, UserSidebarData } from "@/components/core/CustomSidebar";
import Footer from "@/components/core/Footer";
import Header from "@/components/core/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const accountStatus = session && session.user && session.user.id ? (await prisma.user.findUnique({
    where: {
      id: session?.user.id
    },
    select: {
      userStatus: true
    }
  }))?.userStatus
    : undefined

  return <>
    <div className="relative min-h-svh">
      <SidebarProvider>
        {session && session.user && <CustomSidebar
          data={UserSidebarData}
          admin={isAdmin ? isAdmin.admin : false}
          footer
          header={
            <>
              ICN
            </>
          }
        />}
        <div className="w-full max-lg:min-w-0 flex flex-col">
          <Header sidebar={session && session.user ? true : false} />

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
