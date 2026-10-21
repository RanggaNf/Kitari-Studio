import { cloudinaryImage } from "@/lib/cloudinary/assets";

export function slugifyProjectTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveProjectImage(source: string) {
  return cloudinaryImage(source);
}
