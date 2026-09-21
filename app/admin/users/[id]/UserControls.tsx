"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/generated/prisma/client";
import {
  ADMIN_AdjustUserCreditAction,
  ADMIN_SetUserStatusAction,
  ADMIN_UpdateUserProfileAction,
} from "@/lib/actions/admin.users.actions";
import { userStatusLabels } from "@/lib/user-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

type Account = Omit<User, "password">;

function useUserMutation() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  function run(action: () => Promise<unknown>, done?: () => void) {
    setError("");
    startTransition(async () => {
      try {
        await action();
        toast.add({ title: "تغییرات ذخیره شد", type: "success" });
        done?.();
        router.refresh();
      } catch {
        setError(
          "تغییرات ذخیره نشد. اطلاعات و وضعیت فعلی حساب را بررسی کنید؛ در صورت تغییر موجودی یا وضعیت، صفحه را تازه کنید.",
        );
      }
    });
  }
  return { pending, error, run };
}

export function UserControls({ user }: { user: Account }) {
  const [status, setStatus] = useState<string>(user.userStatus);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const { pending, error, run } = useUserMutation();
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="font-semibold">وضعیت حساب</h2>
        <p className="text-muted-foreground">
          وضعیت فعلی: {userStatusLabels[user.userStatus]}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(value) => value && setStatus(value)}
            items={userStatusLabels}
          >
            <SelectTrigger aria-label="وضعیت حساب" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(userStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={pending || status === user.userStatus}
            onClick={() => setConfirmStatus(status)}
          >
            تغییر وضعیت
          </Button>
          <Button
            variant="outline"
            disabled={pending || user.userStatus === "VERIFIED"}
            onClick={() => setConfirmStatus("VERIFIED")}
          >
            تایید حساب
          </Button>
          <Button
            variant="destructive"
            disabled={pending || user.userStatus === "REJECTED"}
            onClick={() => setConfirmStatus("REJECTED")}
          >
            رد حساب
          </Button>
        </div>
      </section>
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="font-semibold">ویرایش اطلاعات کاربر</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const field = (name: string) => String(form.get(name) ?? "");
            run(() =>
              ADMIN_UpdateUserProfileAction({
                id: user.id,
                username: field("username"),
                number: field("number"),
                address: field("address"),
                nationalCode: field("nationalCode"),
                managementName: field("managementName"),
                storeName: field("storeName"),
              }),
            );
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {(
            [
              ["username", "نام کاربری"],
              ["number", "شماره همراه"],
              ["managementName", "نام مدیر"],
              ["storeName", "نام فروشگاه"],
              ["nationalCode", "کد ملی"],
            ] as const
          ).map(([name, label]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                name={name}
                defaultValue={user[name]}
                required={name === "username" || name === "number"}
                minLength={name === "username" ? 4 : undefined}
                maxLength={
                  name === "username"
                    ? 15
                    : name === "number"
                      ? 11
                      : name === "nationalCode"
                        ? 10
                        : 100
                }
                pattern={
                  name === "number"
                    ? "09[0-9]{9}"
                    : name === "nationalCode"
                      ? "[0-9]{10}"
                      : undefined
                }
                dir={
                  name === "number" || name === "nationalCode"
                    ? "ltr"
                    : undefined
                }
                disabled={pending}
              />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">آدرس</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={user.address}
              maxLength={1000}
              disabled={pending}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={pending}>
            {pending && <Spinner />}ذخیره اطلاعات
          </Button>
        </form>
      </section>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Dialog
        open={confirmStatus !== null}
        onOpenChange={(open) => !pending && !open && setConfirmStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر وضعیت حساب</DialogTitle>
            <DialogDescription>
              وضعیت حساب {user.username} به «
              {confirmStatus
                ? userStatusLabels[
                    confirmStatus as keyof typeof userStatusLabels
                  ]
                : ""}
              » تغییر کند؟
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                confirmStatus &&
                run(
                  () =>
                    ADMIN_SetUserStatusAction({
                      id: user.id,
                      status: confirmStatus,
                      expectedStatus: user.userStatus,
                    }),
                  () => setConfirmStatus(null),
                )
              }
            >
              {pending && <Spinner />}تایید تغییر
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmStatus(null)}
            >
              لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UserCreditControls({ user }: { user: Account }) {
  const [direction, setDirection] = useState("increase");
  const [amount, setAmount] = useState("");
  const [adjustment, setAdjustment] = useState<{
    amount: number;
    reason: string;
  } | null>(null);
  const { pending, error, run } = useUserMutation();
  return (
    <section className="space-y-3 rounded-lg border p-3">
      <h2 className="font-semibold">اصلاح اعتبار حساب</h2>
      <p>
        اعتبار فعلی:{" "}
        <span className="font-semibold">
          {user.credit.toLocaleString("fa-IR")}
        </span>{" "}
        تومان
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setAdjustment({
            amount:
              Number(data.get("amount")) * (direction === "decrease" ? -1 : 1),
            reason: String(data.get("reason")).trim(),
          });
        }}
      >
        <div className="space-y-2 mt-auto">
          <Label>نوع تغییر</Label>
          <Select
            value={direction}
            onValueChange={(value) => value && setDirection(value)}
            items={{ increase: "افزایش اعتبار", decrease: "کاهش اعتبار" }}
          >
            <SelectTrigger aria-label="نوع تغییر اعتبار">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="increase">افزایش اعتبار</SelectItem>
              <SelectItem value="decrease">کاهش اعتبار</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">
            <span>مبلغ</span>

            <span className="text-sm text-muted-foreground">
              {amount ? Number(amount).toLocaleString() + " " : "0"}
              <span className="text-emerald-500 font-semibold">تومان</span>
            </span>
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            max={
              direction === "decrease"
                ? Math.max(0, user.credit)
                : 2147483647 - user.credit
            }
            step={1}
            required
            disabled={pending}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="min-w-12 flex-1 space-y-2">
          <Label htmlFor="reason">دلیل تغییر اعتبار</Label>
          <Input
            id="reason"
            name="reason"
            required
            minLength={3}
            maxLength={500}
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending}>
          بررسی و ثبت
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        این اصلاح مستقیماً روی موجودی اعمال و در گزارش فعالیت‌ها ثبت می‌شود.
      </p>
      <Dialog
        open={adjustment !== null}
        onOpenChange={(open) => !pending && !open && setAdjustment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تایید تغییر اعتبار</DialogTitle>
            <DialogDescription>
              اعتبار حساب {user.username} از{" "}
              {user.credit.toLocaleString("fa-IR")} به{" "}
              {(user.credit + (adjustment?.amount ?? 0)).toLocaleString(
                "fa-IR",
              )}{" "}
              تومان تغییر کند؟
            </DialogDescription>
          </DialogHeader>
          <p className="break-words">{adjustment?.reason}</p>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                adjustment &&
                run(
                  () =>
                    ADMIN_AdjustUserCreditAction({
                      id: user.id,
                      expectedCredit: user.credit,
                      ...adjustment,
                    }),
                  () => setAdjustment(null),
                )
              }
            >
              {pending && <Spinner />}ثبت تغییر اعتبار
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setAdjustment(null)}
            >
              لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
