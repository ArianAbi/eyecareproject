"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { UpdateCartItemGuaranteeAction } from "@/lib/actions/guarantee.actions";

export default function GuaranteeDialog({ cartItemId, clientName = "", adminUserId, disabled, onSaved, onPendingChange }: {
  cartItemId?: string;
  clientName?: string;
  adminUserId?: string;
  disabled?: boolean;
  onSaved: (name: string) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(clientName);
  const [saving, setSaving] = useState(false);
  const inputId = useId();

  async function save() {
    if (!cartItemId || saving || disabled) return;
    setSaving(true);
    onPendingChange?.(true);
    try {
      const result = await UpdateCartItemGuaranteeAction(cartItemId, name, adminUserId);
      onSaved(result.guaranteeClientName);
      setOpen(false);
    } catch {
      toast.add({ type: "error", title: "نام گارانتی ذخیره نشد؛ دوباره تلاش کنید" });
    } finally {
      setSaving(false);
      onPendingChange?.(false);
    }
  }

  return <Dialog open={open} onOpenChange={value => {
    if (saving) return;
    if (value) setName(clientName);
    setOpen(value);
  }}>
    <DialogTrigger render={<Button type="button" variant="outline" disabled={disabled || !cartItemId} />}>
      <span className="max-w-40 truncate">{clientName || "نام گارانتی"}</span>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>گارانتی محصول</DialogTitle>
        <DialogDescription>نام مشتری برای گارانتی این قلم سفارش ذخیره می‌شود. این فیلد اختیاری است.</DialogDescription>
      </DialogHeader>
      <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4">
        <label htmlFor={inputId}>نام مشتری</label>
        <Input id={inputId} value={name} maxLength={200} disabled={saving} onChange={event => setName(event.target.value)} />
        <DialogFooter>
          <Button type="submit" disabled={saving || disabled}>{saving ? "در حال ذخیره..." : "ذخیره"}</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>لغو</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
