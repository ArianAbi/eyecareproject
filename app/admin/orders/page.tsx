import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import TableLoading from "@/components/core/TableLoading";
import { AdminUserSearchFilter } from "@/components/core/AdminUserSearchFilter";

export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<{
    userId:string
}>}) {
    const params = await searchParams

    const extractedId = params.userId ? JSON.parse(params.userId).value : null

    const submitedOrdersOnly = await ADMIN_GetOrdersAction({
        status: 'SUBMITIED',
        userId: extractedId ?? null
    })


    return <>
        <Tabs>
            <TabsList >
                <TabsTrigger value="submitted">در انتظار تایید</TabsTrigger>
                <TabsTrigger value="rest">سایر سفارش ها</TabsTrigger>
            </TabsList>

            <div className="border border-dashed rounded-lg p-3">

                <TabsContent value="submitted">
                    <div className="w-44 space-y-1">
                        <AdminUserSearchFilter 
                        initialValue={params.userId}
                        paramKey="userId" 
                        />
                    </div>

                    <DataTable data={submitedOrdersOnly.data} columns={AdminOrdersColumn} />
                </TabsContent>

                <TabsContent value="rest">
                    <Suspense fallback={<TableLoading />}>
                        <RestOfOrders />
                    </Suspense>
                </TabsContent>
            </div>
        </Tabs>
    </>
}

async function RestOfOrders() {
    const restOfOrders = await ADMIN_GetOrdersAction({
        status: 'SUBMITIED',
        excludeStatus: true
    })

    return <DataTable data={restOfOrders.data} columns={AdminOrdersColumn} />
}