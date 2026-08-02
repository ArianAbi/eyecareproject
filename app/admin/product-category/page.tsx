import { DataTable } from "@/components/ui/data-table";
import CreateProductCategoryBtn from "./CreateProductCategoryBtn";
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { AdminSubCategoryColumn } from "./columns";
import { ADMIN_GetMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";

export default async function MasterCategoryPage() {
  
    const masterCategorys = await ADMIN_GetMasterCategorys()
    const productCategorys = await ADMIN_GetProductCategorys()

    return <div className="space-y-3">
        <h1>دسته بندی محصولات</h1>

        <CreateProductCategoryBtn masterCategorys={masterCategorys.data}/>

        <DataTable data={productCategorys.data} columns={AdminSubCategoryColumn} />
    </div>
}