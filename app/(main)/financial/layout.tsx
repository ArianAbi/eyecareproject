import type { Metadata } from "next"
import { auth } from "@/lib/Auth"
import { redirect } from "next/navigation"
export const metadata: Metadata = { title: "مالی", robots: { index: false, follow: false } }
export default async function FinancialLayout({ children }: { children: React.ReactNode }) {
  if (!(await auth())?.user?.id) redirect("/login")
  return children
}
