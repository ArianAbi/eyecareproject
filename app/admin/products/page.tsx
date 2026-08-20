import { buttonVariants } from "@/components/ui/button";
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import Link from "next/link";

export default async function MasterCategoryPage() {

    const categorys = await ADMIN_GetProductCategorys()
    // const products = await ADMIN_GetProducts()

    return <div className="space-y-3">
        <h1>محصولات</h1>

        <Link href={'/admin/products/create'} className={buttonVariants({variant:"default"})}>
            افزودن محصول
        </Link>

        <pre>
            {/* {JSON.stringify(products)} */}
        </pre>
        {/* <DataTable data={productCategorys.data} columns={AdminSubCategoryColumn} /> */}
    </div>
}