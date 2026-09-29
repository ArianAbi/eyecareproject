"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateBlogPost } from "@/lib/actions/admin.blog.actions";

export function DuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <span><button type="button" disabled={pending} onClick={async () => { setPending(true); const result = await duplicateBlogPost(id); setPending(false); if (!result.success) setError(result.error); else router.push(`/admin/blog/${result.id}`); }}>کپی</button>{error && <span role="alert" className="block text-xs text-destructive">{error}</span>}</span>;
}
