"use server";

import { revalidatePath } from "next/cache";
import { ActionError } from "../action-error";
import { auth } from "../Auth";
import prisma from "../db";
import { BALE_SendMessage } from "./bale.actions";
import { emojis } from "../emojis";
import { bale_hashtags } from "../bale-hashtags";

export async function SaveProfileInfoAction(input: {
  address: string;
  nationalCode: string;
  managementName: string;
}) {
  try {
    const session = await auth();

    if (!session || !session.user.id)
      throw new Error("شما در هیچ حسابی لاگین نیستید");
    if (input.nationalCode.length !== 10)
      throw new Error("فرمت کدملی وارد شده صحیح نیست");

    const data = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        address: input.address,
        managementName: input.managementName,
        nationalCode: input.nationalCode,
        userStatus: "WAITING_FOR_APPROVAL",
      },
    });

    BALE_SendMessage(`${emojis.note} درخواست احراز هویت
        نام مدیریت : ${data.managementName}
        کدملی : ${data.nationalCode}
        آدرس : ${data.address}
        
                        ${bale_hashtags.account_verify_request}
                        `);

    revalidatePath("/profile");
    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) {
      throw new ActionError({
        error: err.message,
      });
    }

    console.log(err);

    throw new ActionError({
      error: "unknown",
    });
  }
}
