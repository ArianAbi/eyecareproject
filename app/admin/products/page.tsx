import { buttonVariants } from "@/components/ui/button";
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { ADMIN_GetProducts } from "@/lib/actions/admin.products.action";
import Link from "next/link";
import { AdminProductsColumn } from "./columns";
import { DataTable } from "@/components/ui/data-table";

export default async function MasterCategoryPage() {

    // const categorys = await ADMIN_GetProductCategorys()
    const products = await ADMIN_GetProducts()

    return <div className="space-y-3">
        <h1>محصولات</h1>

        <Link href={'/admin/products/create'} className={buttonVariants({variant:"default"})}>
            افزودن محصول
        </Link>

        <DataTable data={products.data} columns={AdminProductsColumn} />
    </div>
}