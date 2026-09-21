import { GetProductsAction } from "@/lib/actions/products.action"
import GlasslensOrderPage from "./GlasslensOrderPage"
import { ADMIN_GetProductCategorys } from "@/lib/actions/admin.productCategory.actions"
import { GetProductCategorys } from "@/lib/actions/productCategory.action"
import { GetTags } from "@/lib/actions/tags.action"
import { GetUserCartItemsAction } from "@/lib/actions/cart.actions"
import { auth } from "@/lib/Auth"
import prisma from "@/lib/db"

export default async function OrderPage() {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
        throw new Error("you are not logged in")
    }

    const accountStatus = await prisma.user.findUnique({
        where:{
            id:session.user.id
        },
        select:{
            userStatus:true
        }
    })

    const products = await GetProductsAction()
    const categorys = await GetProductCategorys(true)
    const tags = await GetTags()

    const UserCart = await GetUserCartItemsAction(session.user.id)    
    
    return (
        <GlasslensOrderPage
            cartItems={UserCart.data ? UserCart.data.cartItems : []}
            products={products.data}
            categorys={categorys.data}
            accountStatus={accountStatus?.userStatus}
            userCredit={session.user.credit}
            tags={tags.data}
        />
    )
}