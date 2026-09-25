"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteImageAction } from "@/lib/actions/images.action";
import { Button } from "@/components/ui/button";
export default function UploadList({ assets }: { assets: { filename: string; size: number }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <><p role="status">{error}</p><ul>{assets.map(asset => <li key={asset.filename} className="flex items-center gap-4 border-b p-3">
    <a href={`/api/images/${asset.filename}`} target="_blank" rel="noreferrer">????? ????? ({Math.ceil(asset.size / 1024)} KB)</a>
    <Button disabled={pending} variant="destructive" onClick={() => startTransition(async () => {
      try { const result = await deleteImageAction(`/api/images/${asset.filename}`); if (!result.success) setError("??? ????? ???"); else { setError(""); router.refresh(); } }
      catch { setError("??? ????? ???"); }
    })}>???</Button>
  </li>)}</ul></>;
}
