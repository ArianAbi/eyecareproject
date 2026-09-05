import { ADMIN_GetTags } from "@/lib/actions/admin.tag.action";
import { AdminCreateTagBtn } from "./AdminCreateTags";
import { DataTable } from "@/components/ui/data-table";
import { AdminTagsColumn } from "./column";

export default async function AdminTagsPage() {

    const tags = await ADMIN_GetTags() 

    return (
        <div>
            <AdminCreateTagBtn />

            <DataTable data={tags.data} columns={AdminTagsColumn} />
        </div>
    )
}
