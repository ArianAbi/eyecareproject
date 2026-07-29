import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from "@/components/ui/table"
import { ADMIN_GetUsersActions } from "@/lib/actions/admin.users.actions"
import { CheckIcon, EyeIcon, XIcon } from "lucide-react"
import { format } from "date-fns-jalali"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { AdminUserColumns } from "./columns"

export default async function UsersPage() {

    const users = await ADMIN_GetUsersActions()
    
    return <div className="space-y-3">
        <h1>لیست کاربر ها</h1>
        <DataTable data={users} columns={AdminUserColumns} />
    </div>
}