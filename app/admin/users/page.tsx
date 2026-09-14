import { ADMIN_GetUsersActions } from "@/lib/actions/admin.users.actions"
import { DataTable } from "@/components/ui/data-table"
import { AdminUserColumns } from "./columns"

export default async function UsersPage() {

    const users = await ADMIN_GetUsersActions()
    
    return <div className="space-y-3">
        <h1>لیست کاربر ها</h1>
        <DataTable data={users} columns={AdminUserColumns} />
    </div>
}