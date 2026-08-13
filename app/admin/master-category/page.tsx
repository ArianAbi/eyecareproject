import { DataTable } from "@/components/ui/data-table";
import CreateMasterCategoryBtn from "./CreateMasterCategoryBtn";
import { ADMIN_GetMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { AdminMasterCategoryColumns } from "./columns";

export default async function MasterCategoryPage() {

    const masterCategory = await ADMIN_GetMasterCategorys()

    console.log(masterCategory);

    return <div className="space-y-3">
        <h1>دسته بندی کلی</h1>

        <CreateMasterCategoryBtn />

        <DataTable data={masterCategory.data} columns={AdminMasterCategoryColumns} />
    </div>
}