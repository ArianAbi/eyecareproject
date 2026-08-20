import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import AdminCreateProductForm from "./AdminCreateProductForm";

export default async function AdminProductCreatePage(){

    // TODO
    const categorys = await ADMIN_GetProductCategorys()

    return (
        <AdminCreateProductForm categorys={categorys.data}/>
    )
}