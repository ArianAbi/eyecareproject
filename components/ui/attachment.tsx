"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Adapted to this project's styling from the shadcn Base UI Attachment composition:
// https://ui.shadcn.com/docs/components/base/attachment
export function Attachment({ className, state = "done", ...props }: ComponentProps<"div"> & {
  state?: "idle" | "uploading" | "processing" | "error" | "done";
}) {
  return <div data-slot="attachment" data-state={state}
    aria-busy={state === "uploading" || state === "processing"}
    className={cn("flex items-center gap-3 rounded-xl border p-3 data-[state=error]:border-destructive", className)} {...props} />;
}
export function AttachmentMedia({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="attachment-media" className={cn("bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg [&>img]:size-full [&>img]:object-cover", className)} {...props} />;
}
export function AttachmentContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="attachment-content" className={cn("min-w-0 flex-1", className)} {...props} />;
}
export function AttachmentTitle({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="attachment-title" className={cn("truncate text-sm font-medium", className)} {...props} />;
}
export function AttachmentDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="attachment-description" className={cn("text-muted-foreground text-xs", className)} {...props} />;
}
export function AttachmentActions({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="attachment-actions" className={cn("flex items-center gap-1", className)} {...props} />;
}
export function AttachmentAction(props: ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" size="icon" {...props} />;
}
