import { unwrapActionResult } from "@/lib/action-result";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { SubmitCartOrderAction } from "@/lib/actions/cart.actions";
import { ADMIN_SubmitCartOrderAction } from "@/lib/actions/admin.cart.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SubmitOrderBtn({
  customerNote = "",
  disabled = false,
  adminUserId,
  onPendingChange,
}: {
  customerNote?: string;
  disabled?: boolean;
  adminUserId?: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  async function SubmitOrder() {
    if (disabled || loading) return;
    try {
      setLoading(true);
      onPendingChange?.(true);

      const result = unwrapActionResult(await (adminUserId
        ? ADMIN_SubmitCartOrderAction(adminUserId, {
            deliveryPrice: 0,
            customerNote,
          })
        : SubmitCartOrderAction({ deliveryPrice: 0, customerNote })));
      if (!result.success)
        throw new Error("سفارش ثبت نشد؛ حساب و سبد خرید را بررسی کنید");

      toast.add({
        type: "Success",
        title: "سفارش ثبت شد",
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.add({ type: "error", title: "????? ??? ???", description: err instanceof Error ? err.message : "?????? ???? ????" });
    } finally {
      setLoading(false);
      onPendingChange?.(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={buttonVariants({ variant: "green" })}
        >
          <span>ثبت سفارش</span>
          {loading && (
            <span>
              <Spinner />
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle className={"text-sm"}>ثبت نهایی سفارش</PopoverTitle>
          </PopoverHeader>

          <div className="flex gap-1">
            <Button
              onClick={SubmitOrder}
              disabled={disabled || loading}
              variant={"green"}
              className="text-xs"
            >
              <span>ثبت سفارش</span>
              {loading && (
                <span>
                  <Spinner />
                </span>
              )}
            </Button>

            <Button
              onClick={() => setOpen(false)}
              variant={"outline"}
              className={"text-xs"}
            >
              لغو
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
