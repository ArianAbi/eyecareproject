import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import AdminCreateProductForm from "./AdminCreateProductForm";
import { ADMIN_GetTags } from "@/lib/actions/admin.tag.action";

export default async function AdminProductCreatePage(){

    // TODO
    const categorys = await ADMIN_GetProductCategorys()
    const tags = await ADMIN_GetTags()

    return (
        <AdminCreateProductForm categorys={categorys.data} tags={tags.data}/>
    )
}