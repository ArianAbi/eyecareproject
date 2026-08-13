import { DataTable } from "@/components/ui/data-table";
import CreateProductBtn from "./CreateProductBtn";
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { ADMIN_GetProducts } from "@/lib/actions/admin.products.action";

export default async function MasterCategoryPage() {

    const categorys = await ADMIN_GetProductCategorys()
    const products = await ADMIN_GetProducts()

    return <div className="space-y-3">
        <h1>محصولات</h1>

        <CreateProductBtn categorys={categorys.data} />

        <pre>
            {JSON.stringify(products)}
        </pre>
        {/* <DataTable data={productCategorys.data} columns={AdminSubCategoryColumn} /> */}
    </div>
}