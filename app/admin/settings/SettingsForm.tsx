"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { settingsSchema } from "@/lib/schemas/settings";
import { saveSettings } from "@/lib/actions/admin.settings.actions";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export default function SettingsForm({ initialValues }: { initialValues: z.input<typeof settingsSchema> }) {
  const { control, handleSubmit, formState } = useForm<z.input<typeof settingsSchema>, unknown, z.output<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema), defaultValues: initialValues,
  });
  const submit = handleSubmit(async values => {
    try {
      const result = await saveSettings({ ...values, baleGroupId: values.baleGroupId ?? "", telegramGroupId: values.telegramGroupId ?? "" });
      toast.add({ title: result.success ? "تنظیمات ذخیره شد" : "خطا", description: result.error, type: result.success ? "success" : "error" });
    } catch {
      toast.add({ title: "ذخیره تنظیمات انجام نشد؛ دوباره تلاش کنید", type: "error" });
    }
  });
  return <form onSubmit={submit} className="space-y-5 rounded-xl border p-5">
    <FormFieldShorthand control={control} name="siteName" label="نام سایت" description="برای عنوان صفحات و اطلاعات اشتراک‌گذاری سایت" disabled={formState.isSubmitting} />
    <FormFieldShorthand control={control} name="deliveryPrice" label="هزینه ارسال (تومان)" type="number" integerInput disabled={formState.isSubmitting} />
    <FormFieldShorthand control={control} name="cutPrice" label="هزینه برش (تومان)" type="number" integerInput disabled={formState.isSubmitting} />
    <FormFieldShorthand control={control} name="baleGroupId" label="شناسه گروه بله" disabled={formState.isSubmitting} />
    <FormFieldShorthand control={control} name="telegramGroupId" label="شناسه گروه تلگرام" disabled={formState.isSubmitting} />
    <p className="text-sm text-muted-foreground">هزینه‌ها و شناسه گروه‌ها ذخیره می‌شوند؛ اعمال هزینه‌ها روی سفارش و ارسال پیام هنوز فعال نیست.</p>
    <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? "در حال ذخیره…" : "ذخیره تنظیمات"}</Button>
  </form>;
}
