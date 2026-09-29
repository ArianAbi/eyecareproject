"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveBlogPost } from "@/lib/actions/admin.blog.actions";

export function ArchiveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <span><button type="button" disabled={pending} className="text-destructive" onClick={async () => { if (!window.confirm("مقاله بایگانی شود؟")) return; setPending(true); const result = await archiveBlogPost(id); setPending(false); if (!result.success) setError(result.error); else router.refresh(); }}>بایگانی</button>{error && <span role="alert" className="block text-xs text-destructive">{error}</span>}</span>;
}
