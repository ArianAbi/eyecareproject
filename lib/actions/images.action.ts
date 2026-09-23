"use server";

import { auth } from "@/lib/Auth";
import { MAX_IMAGE_BYTES, type ImageUploadResult } from "@/lib/image-upload";
import { InvalidImageError, storeImage } from "@/lib/image-storage";

export async function uploadImageAction(formData: FormData): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Sign in to upload an image." };
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Choose an image to upload." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: "Choose an image no larger than 5 MB." };
    }
    return { success: true, data: await storeImage(Buffer.from(await file.arrayBuffer())) };
  } catch (error) {
    if (error instanceof InvalidImageError) return { success: false, error: error.message };
    console.error("Image upload failed", error);
    return { success: false, error: "Unable to store the image. Please try again." };
  }
}
