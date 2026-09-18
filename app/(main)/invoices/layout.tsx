import type { Metadata } from "next"
import { auth } from "@/lib/Auth"
import { redirect } from "next/navigation"
export const metadata: Metadata = { title: "صورتحساب‌ها", robots: { index: false, follow: false } }
export default async function AccountSectionLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    return children
}
