"use client";

import { useEffect, useState } from "react";
import { PreviewDiscount } from "@/lib/actions/discount.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function DiscountCodeField({
  adminUserId,
  cartKey,
  onChange,
}: {
  adminUserId?: string;
  cartKey: string;
  onChange: (result: { code: string; amount: number } | null) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    onChange(null);
  }, [cartKey, onChange]);

  async function apply() {
    setPending(true);
    setError("");
    try {
      const result = await PreviewDiscount(code, adminUserId);
      if ("error" in result) {
        onChange(null);
        setError(result.error);
        return;
      }
      onChange({ code: result.code, amount: result.amount });
    } catch {
      onChange(null);
      setError("بررسی کد تخفیف انجام نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="my-3 space-y-2">
      <label htmlFor="discount-code" className="text-sm">
        کد تخفیف
      </label>
      <div className="flex gap-2">
        <Input
          id="discount-code"
          value={code}
          maxLength={64}
          disabled={pending}
          onChange={(event) => {
            setCode(event.target.value);
            onChange(null);
            setError("");
          }}
          placeholder="کد تخفیف"
          dir="ltr"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !code.trim()}
          onClick={apply}
        >
          <span>اعمال</span>
          {pending && <Spinner />}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
