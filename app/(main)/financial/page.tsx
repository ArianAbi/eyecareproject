import { requireUser } from "@/lib/access"
import prisma from "@/lib/db"
import { getCreditLedger } from "@/lib/credit-ledger"
import { CreditLedger } from "@/components/core/CreditLedger"

export default async function FinancialPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser()
  const [account, ledger] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credit: true } }),
    getCreditLedger(user.id, (await searchParams).page),
  ])
  return <div className="space-y-5 p-4"><h1 className="text-xl font-semibold">مالی</h1>
    <p className="rounded-lg border p-4">اعتبار فعلی: <strong>{new Intl.NumberFormat("fa-IR").format(account.credit)} تومان</strong></p>
    <CreditLedger {...ledger} printHref="/api/financial/print" />
  </div>
}
