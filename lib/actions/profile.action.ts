"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../Auth";
import prisma from "../db";
import { writeAudit } from "../audit";
import { BALE_SendMessage } from "../bale";
const profileSchema = z.object({
    address: z.string().trim().min(5).max(1000),
    nationalCode: z.string().regex(/^\d{10}$/),
    managementName: z.string().trim().min(2).max(100),
}).strict();
export async function SaveProfileInfoAction(input: { address: string; nationalCode: string; managementName: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false as const, error: "Sign in to update your profile." };
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Enter a valid name, address and ten-digit national code." };
    try {
        const saved = await prisma.$transaction(async tx => {
            const result = await tx.user.updateMany({
                where: { id: session.user.id, userStatus: { in: ["UNVERIFIED", "REJECTED"] } },
                data: { ...parsed.data, userStatus: "WAITING_FOR_APPROVAL" },
            });
            if (!result.count) return false;
            await writeAudit(tx, session.user.id!, "PROFILE_SUBMITTED", "User", session.user.id!);
            return true;
        });
        if (!saved) return { success: false as const, error: "This profile is already verified or awaiting approval." };
        await BALE_SendMessage(`Profile verification requested: ${parsed.data.managementName}`);
        revalidatePath("/profile"); revalidatePath("/admin", "layout");
        return { success: true as const };
    } catch (error) {
        console.error("Profile update failed", error);
        return { success: false as const, error: "Unable to save your profile. Please try again." };
    }
}
