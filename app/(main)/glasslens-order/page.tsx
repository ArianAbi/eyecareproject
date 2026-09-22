import GlasslensOrderPage from "./GlasslensOrderPage";
import { GetProductCategorys } from "@/lib/actions/productCategory.action";
import { GetTags } from "@/lib/actions/tags.action";
import { GetUserCartItemsAction } from "@/lib/actions/cart.actions";
import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";

export default async function OrderPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error("you are not logged in");
  }

  const userData = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      userStatus: true,
      credit: true,
    },
  });

  const categorys = await GetProductCategorys();
  const tags = await GetTags();

  const UserCart = await GetUserCartItemsAction(session.user.id);

  return (
    <GlasslensOrderPage
      cartItems={UserCart.data ? UserCart.data.cartItems : []}
      categorys={categorys.data}
      accountStatus={userData?.userStatus}
      userCredit={userData?.credit}
      tags={tags.data}
    />
  );
}
