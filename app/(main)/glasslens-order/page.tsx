import { GetProductsAction } from "@/lib/actions/products.action"
import GlasslensOrderPage from "./GlasslensOrderPage"
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions"
import { GetProductCategorys } from "@/lib/actions/productCategory.action"
import { GetTags } from "@/lib/actions/tags.action"

export default async function OrderPage() {

    const products = await GetProductsAction()
    const categorys = await GetProductCategorys(true)
    const tags = await GetTags()

    return (
        // <pre>
        //     {JSON.stringify(products.data)}
        // </pre>
        <GlasslensOrderPage 
        products={products.data} 
        categorys={categorys.data}
        tags={tags.data}
        />
    )
}