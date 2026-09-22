"use server";

import { writeAudit } from "../audit";

import prisma from "@/lib/db";
import { signIn } from "../Auth";
import { AuthError } from "next-auth";
import { LoginSchema, SignupSchema } from "../schemas/auth.schema";
import { hashPassword } from "../password";
import { ActionError } from "../action-error";
import { BALE_SendMessage } from "./bale.actions";
import { bale_hashtags } from "../bale-hashtags";
import { emojis } from "../emojis";
type SignupField = "username" | "number" | "password" | "confirmPassword";

export type CreateUserResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<SignupField, string>>;
    };

export async function CreateUserAction(
  username: string,
  number: string,
  password: string,
): Promise<CreateUserResult> {
  const validateFields = SignupSchema.safeParse({
    username,
    number,
    password,
    confirmPassword: password,
  });

  if (!validateFields.success) {
    const flat = validateFields.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<SignupField, string>> = {};
    for (const [key, messages] of Object.entries(flat)) {
      if (messages?.[0]) fieldErrors[key as SignupField] = messages[0];
    }
    return {
      success: false,
      error: "اطلاعات وارد شده معتبر نیست",
      fieldErrors,
    };
  }

  const data = validateFields.data;

  // Check for duplicates first so we know exactly which field clashed
  const existing = await prisma.user.findMany({
    where: { OR: [{ username: data.username }, { number: data.number }] },
    select: { username: true, number: true },
  });

  if (existing.length > 0) {
    const fieldErrors: Partial<Record<SignupField, string>> = {};
    if (existing.some((u) => u.number === data.number)) {
      fieldErrors.number = "کاربری با این شماره قبلاً ثبت شده است";
    }
    if (existing.some((u) => u.username === data.username)) {
      fieldErrors.username = "این نام کاربری قبلاً گرفته شده است";
    }
    return {
      success: false,
      error: fieldErrors.number ?? fieldErrors.username!,
      fieldErrors,
    };
  }

  try {
    const passwordHash = await hashPassword(data.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          number: data.number,
          password: passwordHash,
        },
      });

      await writeAudit(tx, user.id, "ACCOUNT_CREATED", "User", user.id);
      BALE_SendMessage(`${emojis.user} حساب جدید باز شد
                username = ${user.username}
                phone = ${user.number}

                ${bale_hashtags.new_account}
                `);
    });

    return { success: true };
  } catch (err) {
    // Race condition: someone took the username/number between the check and the insert
    if ((err as { code?: string })?.code === "P2002") {
      return {
        success: false,
        error: "کاربری با این نام کاربری یا شماره قبلاً ثبت شده است",
      };
    }

    console.error(err);

    throw new ActionError({
      error:
        "مشکلی در ایجاد حساب پیش آمده. دوباره تلاش کنید یا با پشتیبانی تماس بگیرید",
    });
  }
}
export async function LoginAction(username: string, password: string) {
  const validateFields = LoginSchema.safeParse({
    username,
    password,
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten(),
    };
  }

  try {
    await signIn("credentials", {
      username: username,
      password: password,
      redirect: true,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: "اطلاعات وارد شده صحیح نمیباشد",
      };
    }
    throw err;
  }
}
