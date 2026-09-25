import CustomPagination from "@/components/core/CustomPagination";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_GetProducts } from "@/lib/actions/admin.products.action";
import Link from "next/link";
import { AdminProductsColumn } from "./columns";
import { DataTable } from "@/components/ui/data-table";

export default async function MasterCategoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  // const categorys = await ADMIN_GetProductCategorys()
  const products = await ADMIN_GetProducts((await searchParams).page);

  return (
    <div className="space-y-3">
      <h1>محصولات</h1>

      <Link
        href={"/admin/products/create"}
        className={buttonVariants({ variant: "default" })}
      >
        افزودن محصول
      </Link>

      <DataTable data={products.data} columns={AdminProductsColumn} />
      <CustomPagination total={products.total} paramKey="page" />
    </div>
  );
}
