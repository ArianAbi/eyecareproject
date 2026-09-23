"use client";

import { useId, useRef, useState, useTransition } from "react";
import { ImageIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { uploadImageAction } from "@/lib/actions/images.action";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, type StoredImage } from "@/lib/image-upload";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent,
  AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";

export type ImageInputProps = {
  value?: StoredImage | null;
  onChange: (image: StoredImage | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onBlur?: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/** Controlled input. Selecting a file uploads it immediately; onChange receives the stored image. */
export function ImageInput({ value, onChange, onUploadingChange, onBlur,
  label = "Image", disabled = false, className, id }: ImageInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  function upload(file: File) {
    if (busy.current || disabled) return;
    setError(null);
    if (!file.size || file.size > MAX_IMAGE_BYTES) {
      setError("Choose a non-empty image no larger than 5 MB.");
      return;
    }
    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      setError("Only JPEG, PNG and WebP images are supported.");
      return;
    }
    busy.current = true;
    setFilename(file.name);
    onUploadingChange?.(true);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        const result = await uploadImageAction(formData);
        if (result.success) onChange(result.data);
        else setError(result.error);
      } catch {
        setError("Upload failed. Check your connection and try again.");
      } finally {
        busy.current = false;
        onUploadingChange?.(false);
      }
    });
  }

  return (
    <Field className={className} data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input id={inputId} type="file" accept={IMAGE_ACCEPT} disabled={disabled || pending}
        onBlur={onBlur} aria-invalid={!!error} aria-describedby={`${inputId}-help ${inputId}-status`}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) upload(file);
        }} />
      <p id={`${inputId}-help`} className="text-muted-foreground text-xs">
        JPEG, PNG or WebP · Up to 5 MB · Compressed automatically
      </p>
      {(value || pending) && (
        <Attachment state={pending ? "uploading" : "done"}>
          <AttachmentMedia>
            {pending ? <LoaderCircleIcon className="size-5 animate-spin" /> : value ? (
              // The upload is already resized and compressed on the server.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt={label} width={64} height={64} />
            ) : <ImageIcon />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{pending ? filename : "Stored image"}</AttachmentTitle>
            <AttachmentDescription>
              {pending ? "Uploading and compressing…" : value && `${value.width} × ${value.height} · ${Math.ceil(value.size / 1024)} KB`}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction disabled={disabled || pending} aria-label={`Remove ${label}`}
              onClick={() => { setError(null); onChange(null); }}><XIcon /></AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
      <p id={`${inputId}-status`} role="status" aria-live="polite" className={error ? "text-destructive text-sm" : "sr-only"}>
        {error ?? (pending ? "Uploading and compressing image." : value ? "Image ready." : "")}
      </p>
    </Field>
  );
}
