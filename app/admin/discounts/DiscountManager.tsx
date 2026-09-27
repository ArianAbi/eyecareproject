"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_SaveDiscount,
  ADMIN_SearchDiscountTargets,
  ADMIN_SetDiscountActive,
} from "@/lib/actions/discount.actions";
import { unwrapActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Discount, DiscountAmountType } from "@/generated/prisma/client";

type Target = { id: string; label: string };
type Row = Discount & {
  users: { id: string; username: string }[];
  products: { id: string; name: string }[];
};
const empty = {
  title: "",
  description: "",
  code: "",
  amountType: "PERCENT" as DiscountAmountType,
  value: "",
  maxUses: "",
  expiresAt: "",
  active: true,
  usersRestricted: false,
  productsRestricted: false,
  users: [] as Target[],
  products: [] as Target[],
};

export default function DiscountManager({ discounts }: { discounts: Row[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState({ user: "", product: "" });
  const [results, setResults] = useState({
    user: [] as Target[],
    product: [] as Target[],
  });

  function edit(row?: Row) {
    setDialogOpen(true);
    setEditingId(row?.id);
    setForm(
      row
        ? {
            title: row.title,
            description: row.description,
            code: row.code,
            amountType: row.amountType,
            value: String(
              row.amountType === "PERCENT" ? row.value / 100 : row.value,
            ),
            maxUses: row.maxUses === null ? "" : String(row.maxUses),
            expiresAt: row.expiresAt
              ? new Date(
                  row.expiresAt.getTime() -
                    row.expiresAt.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)
              : "",
            active: row.active,
            usersRestricted: row.usersRestricted,
            productsRestricted: row.productsRestricted,
            users: row.users.map((user) => ({
              id: user.id,
              label: user.username,
            })),
            products: row.products.map((product) => ({
              id: product.id,
              label: product.name,
            })),
          }
        : empty,
    );
  }

  async function lookup(kind: "user" | "product") {
    try {
      const found = await ADMIN_SearchDiscountTargets(kind, search[kind]);
      setResults((previous) => ({ ...previous, [kind]: found }));
    } catch {
      toast.add({ type: "error", title: "جستجو انجام نشد." });
    }
  }

  async function save() {
    setPending(true);
    try {
      const value =
        form.amountType === "PERCENT"
          ? Number(form.value) * 100
          : Number(form.value);
      unwrapActionResult(
        await ADMIN_SaveDiscount({
          id: editingId,
          title: form.title,
          description: form.description,
          code: form.code,
          amountType: form.amountType,
          value,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt
            ? new Date(form.expiresAt).toISOString()
            : null,
          active: form.active,
          usersRestricted: form.usersRestricted,
          productsRestricted: form.productsRestricted,
          userIds: form.users.map((user) => user.id),
          productIds: form.products.map((product) => product.id),
        }),
      );
      toast.add({ type: "success", title: "تخفیف ذخیره شد." });
      setDialogOpen(false);
      setEditingId(undefined);
      setForm(empty);
      router.refresh();
    } catch (error) {
      toast.add({
        type: "error",
        title:
          error instanceof Error ? error.message : "ذخیره تخفیف انجام نشد.",
      });
    } finally {
      setPending(false);
    }
  }

  async function toggle(row: Row) {
    try {
      unwrapActionResult(await ADMIN_SetDiscountActive(row.id, !row.active));
      router.refresh();
    } catch (error) {
      toast.add({
        type: "error",
        title:
          error instanceof Error ? error.message : "تغییر وضعیت انجام نشد.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <Button type="button" onClick={() => edit()}>
        ایجاد تخفیف
      </Button>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!pending) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش تخفیف" : "تخفیف جدید"}
            </DialogTitle>
            <DialogDescription>
              محدودیت‌ها، مبلغ و زمان اعتبار کد را مشخص کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              عنوان
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </label>
            <label>
              کد
              <Input
                dir="ltr"
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value })
                }
              />
            </label>
            <label>
              نوع تخفیف
              <select
                className="block w-full rounded border bg-background p-2"
                value={form.amountType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amountType: event.target.value as DiscountAmountType,
                  })
                }
              >
                <option value="PERCENT">درصد</option>
                <option value="FLAT">مبلغ ثابت</option>
              </select>
            </label>
            <label>
              {form.amountType === "PERCENT"
                ? "درصد (مثلاً ۱۰ یا ۱۲٫۵)"
                : "مبلغ به تومان"}
              <Input
                type="number"
                min="0"
                step={form.amountType === "PERCENT" ? "0.01" : "1"}
                value={form.value}
                onChange={(event) =>
                  setForm({ ...form, value: event.target.value })
                }
              />
            </label>
            <label>
              حداکثر تعداد استفاده (اختیاری)
              <Input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(event) =>
                  setForm({ ...form, maxUses: event.target.value })
                }
              />
            </label>
            <label>
              تاریخ انقضا (اختیاری)
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm({ ...form, expiresAt: event.target.value })
                }
              />
            </label>
          </div>
          <label className="block">
            توضیحات
            <Input
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
            />
            فعال
          </label>
          {(["user", "product"] as const).map((kind) => {
            const key = kind === "user" ? "users" : "products";
            return (
              <div key={kind} className="space-y-2 rounded border p-3">
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={
                      kind === "user"
                        ? form.usersRestricted
                        : form.productsRestricted
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [kind === "user"
                          ? "usersRestricted"
                          : "productsRestricted"]: event.target.checked,
                      })
                    }
                  />
                  {kind === "user"
                    ? "محدود به کاربران انتخاب شده"
                    : "محدود به محصولات انتخاب شده"}
                </label>
                <p className="text-xs text-muted-foreground">
                  اگر محدودیت خاموش باشد همه{" "}
                  {kind === "user" ? "کاربران" : "محصولات"} مجازند.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={search[kind]}
                    onChange={(event) =>
                      setSearch({ ...search, [kind]: event.target.value })
                    }
                    placeholder="جستجو"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => lookup(kind)}
                  >
                    جستجو
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results[kind].map((target) => (
                    <Button
                      key={target.id}
                      type="button"
                      variant="outline"
                      disabled={form[key].some((item) => item.id === target.id)}
                      onClick={() =>
                        setForm({ ...form, [key]: [...form[key], target] })
                      }
                    >
                      {target.label} +
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {form[key].map((target) => (
                    <Button
                      key={target.id}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          ...form,
                          [key]: form[key].filter(
                            (item) => item.id !== target.id,
                          ),
                        })
                      }
                    >
                      {target.label} ×
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
          <DialogFooter>
            <Button type="button" disabled={pending} onClick={save}>
              ذخیره
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDialogOpen(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <section className="space-y-2">
        <h2 className="font-semibold">کدهای موجود</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان / کد</TableHead>
              <TableHead>تخفیف</TableHead>
              <TableHead>استفاده</TableHead>
              <TableHead>انقضا</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <strong className="block">{row.title}</strong>
                  <code dir="ltr">{row.code}</code>
                </TableCell>
                <TableCell>
                  {row.amountType === "PERCENT"
                    ? `${row.value / 100}٪`
                    : `${row.value.toLocaleString()} تومان`}
                </TableCell>
                <TableCell>
                  {row.usedCount}/{row.maxUses ?? "∞"}
                </TableCell>
                <TableCell>
                  {row.expiresAt
                    ? new Date(row.expiresAt).toLocaleDateString()
                    : "بدون انقضا"}
                </TableCell>
                <TableCell>{row.active ? "فعال" : "غیرفعال"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="edit"
                      onClick={() => edit(row)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => toggle(row)}
                    >
                      {row.active ? "غیرفعال کردن" : "فعال کردن"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!discounts.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  تخفیفی با این فیلتر پیدا نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
