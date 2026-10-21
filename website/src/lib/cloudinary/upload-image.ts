import { z } from "zod";

const allowedImageTypes = new Set(["image/webp"]);
const maximumImageBytes = 5 * 1024 * 1024;

const CloudinaryUploadSchema = z.object({
  secure_url: z.url().startsWith("https://res.cloudinary.com/"),
  public_id: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.literal("webp"),
  bytes: z.number().positive(),
});
export type CloudinaryUpload = z.infer<typeof CloudinaryUploadSchema>;

export async function uploadPublicImage(
  file: File,
  signal?: AbortSignal,
): Promise<CloudinaryUpload> {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Images must be cropped and converted to WebP before upload.");
  }
  if (file.size === 0 || file.size > maximumImageBytes) {
    throw new Error("Image files must be no larger than 5 MB.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary configuration is missing. Set its cloud name and unsigned upload preset in website/.env.local.",
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body, signal },
  );
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Cloudinary upload failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const result = CloudinaryUploadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `Cloudinary returned an invalid image response: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
