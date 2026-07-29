import { DataTable } from "@/components/ui/data-table";
import CreateMasterCategoryBtn from "./CreateMasterCategoryBtn";
import { ADMIN_GetMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";

export default async function MasterCategoryPage() {
  
    const masterCategory = await ADMIN_GetMasterCategorys()

    return <div className="space-y-3">
        <h1>دسته بندی کلی</h1>

        <CreateMasterCategoryBtn />

        {/* <DataTable /> */}
    </div>
}