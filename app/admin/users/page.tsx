import { ADMIN_GetUsersActions } from "@/lib/actions/admin.users.actions"
import { DataTable } from "@/components/ui/data-table"
import { AdminUserColumns } from "./columns"
import { UserFilters } from "./UserFilters"
import type { AdminUserFilters } from "@/lib/actions/admin.users.actions"

export default async function UsersPage({ searchParams }: { searchParams: Promise<AdminUserFilters> }) {

    const users = await ADMIN_GetUsersActions(await searchParams)
    
    return <div className="space-y-3">
        <h1>لیست کاربر ها</h1>
        <UserFilters />
        <DataTable data={users} columns={AdminUserColumns} />
    </div>
}
