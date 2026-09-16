import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import TableLoading from "@/components/core/TableLoading";
import { AdminUserSearchFilter } from "@/components/core/AdminUserSearchFilter";
import CustomPagination from "@/components/core/CustomPagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminOrderDataTableWrapper from "./AdminOrderDataTableWrapper";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { DateFilter } from "@/components/core/DateFilter";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default async function AdminOrdersPage({ searchParams }: {
    searchParams: Promise<{
        userId: string,
        pendingPage?: number,
        restPage?: number
    }>
}) {
    const params = await searchParams

    const extractedId = params.userId ? JSON.parse(params.userId).value : null

    const pendingOrdersOnly = await ADMIN_GetOrdersAction({
        status: 'PENDING',
        userId: extractedId ?? null,
        page: params.pendingPage
    })


    return <>
        <Tabs defaultValue={'submitted'} paramKey="tab">
            <TabsList >
                <TabsTrigger value="submitted">در انتظار تایید</TabsTrigger>
                <TabsTrigger value="rest">سایر سفارش ها</TabsTrigger>
            </TabsList>

            <div className="border border-dashed rounded-lg p-3">

                <TabsContent value="submitted">
                    <Sheet>
                        <SheetTrigger className={buttonVariants({variant:'default',size:'sm'})}>
                                <span>فیلتر</span>
                                <FilterIcon />
                        </SheetTrigger>

                        <SheetContent
                        dir="rtl"
                        style={{maxWidth:'250px'}}
                        >
                            <SheetHeader>
                                <SheetTitle>فیلتر ها</SheetTitle>
                            </SheetHeader>

                            <div className="grid flex-1 auto-rows-min gap-6 px-4">
                                <div className="w-full space-y-1">
                                    <AdminUserSearchFilter
                                        initialValue={params.userId}
                                        paramKey="userId"
                                    />
                                </div>

                                <div className="w-full space-y-1">
                                    <DateFilter 
                                    paramKey="date"
                                    />
                                </div>
                            </div>

                            <SheetFooter>
                                <SheetClose className={cn(buttonVariants({variant:'default',size:'sm'}))}>
                                    بستن
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>


                    <DataTable data={pendingOrdersOnly.data} columns={AdminOrdersColumn} />

                    <CustomPagination
                        paramKey="pendingPage"
                        total={pendingOrdersOnly.total}
                    />
                </TabsContent>

                <TabsContent value="rest">
                    <Suspense fallback={<TableLoading />}>
                        <RestOfOrders restPage={params.restPage} />
                    </Suspense>
                </TabsContent>
            </div>
        </Tabs>

    </>
}

async function RestOfOrders({ restPage }: { restPage?: number }) {

    const restOfOrders = await ADMIN_GetOrdersAction({
        status: 'PENDING',
        excludeStatus: true,
        page: restPage
    })

    return <>
        <span>{restPage}</span>

        <AdminOrderDataTableWrapper
            data={restOfOrders.data}
        />
        <CustomPagination
            paramKey="pendingPage"
            total={restOfOrders.total}
        />
    </>
}