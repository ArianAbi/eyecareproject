import { ADMIN_GetSingleProduct } from "@/lib/actions/admin.products.action"
import AdminEditProductForm from "./AdminEditProductForm"
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions"
import { ADMIN_GetTags } from "@/lib/actions/admin.tag.action"

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await ADMIN_GetSingleProduct(id)
    const tags = await ADMIN_GetTags()

    if (!product.data) throw new Error("No Product was Found")

    const categorys = await ADMIN_GetProductCategorys()

    return (
        <AdminEditProductForm
            id={id}
            categorys={categorys.data}
            product={product.data}
            tags={tags.data}
        />
    )
}