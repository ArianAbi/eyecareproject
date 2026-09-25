import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import ProfileForm from "./ProfileForm";
import ProfileAccountStatus from "./ProfileAccountStatus";

export default async function ProfilePage() {
  const user = await auth();

  if (!user) notFound();

  const profile = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.user.id,
    },
    select: {
      id: true,
      number: true,
      managementName: true,
      nationalCode: true,
      address: true,
      username: true,
      userStatus: true,
    },
  });

  return (
    <div className="w-full px-3">
      {profile.userStatus && (
        <div className="max-w-5xl mx-auto mt-4 mb-2">
          <ProfileAccountStatus accountStatus={profile.userStatus} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 max-w-5xl mx-auto border border-dashed p-3 rounded-lg mt-4">
        {/* username */}
        <div className="space-y-2">
          <Label>نام کاربری</Label>
          <Input disabled value={profile.username} />
        </div>

        {/* phone */}
        <div className="space-y-2">
          <Label>شماره</Label>
          <Input disabled value={profile.number} />
        </div>

        <Link className="underline" href="/profile/uploads">?????? ?????? ????????????</Link>
      <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
