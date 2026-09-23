import type { Metadata } from "next";
import { requireAdmin } from "@/lib/access";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return <div className="mx-auto max-w-2xl space-y-6 py-4">
    <h1 className="text-xl font-semibold">تنظیمات سایت</h1>
    <SettingsForm initialValues={{ siteName: settings.siteName, deliveryPrice: settings.deliveryPrice, cutPrice: settings.cutPrice, baleGroupId: settings.baleGroupId ?? "", telegramGroupId: settings.telegramGroupId ?? "" }} />
  </div>;
}
