import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import TableLoading from "@/components/core/TableLoading";
import { AdminUserSearchFilter } from "@/components/core/AdminUserSearchFilter";
import CustomPagination from "@/components/core/CustomPagination";

export default async function AdminOrdersPage({ searchParams }: {
    searchParams: Promise<{
        userId: string,
        pendingPage?: number,
        restPage?: number
    }>
}) {
    const params = await searchParams

    const extractedId = params.userId ? JSON.parse(params.userId).value : null

    const submitedOrdersOnly = await ADMIN_GetOrdersAction({
        status: 'PENDING',
        userId: extractedId ?? null,
        page: params.pendingPage
    })


    return <>
        <Tabs paramKey="tab">
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

                    <CustomPagination
                        paramKey="pendingPage"
                        total={submitedOrdersOnly.total}
                    />
                </TabsContent>

                <TabsContent value="rest">
                    <Suspense fallback={<TableLoading />}>
                        <RestOfOrders restPage={params.restPage}/>
                    </Suspense>
                </TabsContent>
            </div>
        </Tabs>

    </>
}

async function RestOfOrders({restPage}:{restPage?:number}) {

    const restOfOrders = await ADMIN_GetOrdersAction({
        status: 'PENDING',
        excludeStatus: true,
        page: restPage
    })

    return <>
        <span>{restPage}</span>
        <DataTable data={restOfOrders.data} columns={AdminOrdersColumn} />

        <CustomPagination
            paramKey="pendingPage"
            total={restOfOrders.total}
        />
    </>
}