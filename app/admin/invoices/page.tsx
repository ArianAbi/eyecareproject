import { InvoiceList } from "@/components/core/InvoiceList";
import type { InvoiceFilters } from "@/lib/invoice-filters";

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoiceFilters>;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">مدیریت صورتحساب‌ها</h1>
      <InvoiceList admin filters={await searchParams}>
        <></>
      </InvoiceList>
    </div>
  );
}
