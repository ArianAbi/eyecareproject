import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminOrdersPage() {
    const submitedOrdersOnly = await ADMIN_GetOrdersAction({
        status: 'SUBMITIED'
    })

    return <>
        <Tabs>
            <TabsList >
                <TabsTrigger value="submitted">در انتظار تایید</TabsTrigger>
                <TabsTrigger value="rest">سایر سفارش ها</TabsTrigger>
            </TabsList>

            <div className="border border-dashed rounded-lg p-3">

                <TabsContent value="submitted">
                    <DataTable data={submitedOrdersOnly.data} columns={AdminOrdersColumn} />
                </TabsContent>

                <TabsContent value="rest">
                    EMPTY
                    {/* <DataTable data={submitedOrdersOnly.data} columns={AdminOrdersColumn} /> */}
                </TabsContent>
            </div>
        </Tabs>
    </>
}