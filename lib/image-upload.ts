export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export type StoredImage = {
  url: string;
  /** A complete data URL suitable for next/image's blurDataURL. */
  base64: string;
  width: number;
  height: number;
  size: number;
};

export type ImageUploadResult =
  | { success: true; data: StoredImage }
  | { success: false; error: string };
