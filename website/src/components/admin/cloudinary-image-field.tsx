"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import Image from "next/image";
import { uploadPublicImage } from "@/lib/cloudinary/upload-image";

type CloudinaryImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  fieldName?: string;
  required?: boolean;
  aspectRatio?: number;
};

type SelectedImage = {
  file: File;
  url: string;
  width: number;
  height: number;
};

const cropWidth = 640;
const outputWidth = 1600;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function webpBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The browser could not convert this image to WebP.")),
      "image/webp",
      quality,
    );
  });
}

async function createCroppedWebp(
  image: SelectedImage,
  zoom: number,
  offsetX: number,
  offsetY: number,
  aspectRatio: number,
) {
  const cropHeight = cropWidth / aspectRatio;
  const outputHeight = Math.round(outputWidth / aspectRatio);
  const scale = Math.max(cropWidth / image.width, cropHeight / image.height) * zoom;
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  const maxOffsetX = Math.max(0, (renderedWidth - cropWidth) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - cropHeight) / 2);
  const sourceX = clamp(
    (maxOffsetX - offsetX * maxOffsetX) / scale,
    0,
    image.width - cropWidth / scale,
  );
  const sourceY = clamp(
    (maxOffsetY - offsetY * maxOffsetY) / scale,
    0,
    image.height - cropHeight / scale,
  );
  const sourceWidth = cropWidth / scale;
  const sourceHeight = cropHeight / scale;
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot crop images.");

  const croppedImage = new window.Image();
  croppedImage.src = image.url;
  await croppedImage.decode();
  context.drawImage(
    croppedImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  let blob = await webpBlob(canvas, 0.82);
  if (blob.size > 5 * 1024 * 1024) blob = await webpBlob(canvas, 0.68);
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error("The compressed WebP is still larger than 5 MB.");
  }
  return new File([blob], `${image.file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}

export function CloudinaryImageField({
  value,
  onChange,
  fieldName,
  required = false,
  aspectRatio = 4 / 3,
}: CloudinaryImageFieldProps) {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(cropWidth);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setViewportWidth(entry.contentRect.width);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [selectedImage]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose an image smaller than 20 MB before compression.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setSelectedImage({
        file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setError("");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("This image could not be opened.");
    };
    image.src = url;
  };

  const closeCropper = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage.url);
    setSelectedImage(null);
  };

  const confirmCrop = async () => {
    if (!selectedImage || uploading) return;
    setUploading(true);
    setError("");
    try {
      const file = await createCroppedWebp(
        selectedImage,
        zoom,
        offsetX,
        offsetY,
        aspectRatio,
      );
      const result = await uploadPublicImage(file);
      onChange(result.secure_url);
      closeCropper();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const scale = selectedImage
    ? Math.max(
        viewportWidth / selectedImage.width,
        viewportWidth / aspectRatio / selectedImage.height,
      ) * zoom
    : 1;
  const renderedWidth = selectedImage ? selectedImage.width * scale : 0;
  const renderedHeight = selectedImage ? selectedImage.height * scale : 0;
  const maxOffsetX = Math.max(0, (renderedWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewportWidth / aspectRatio) / 2);
  const imageStyle = selectedImage
    ? {
        width: renderedWidth,
        height: renderedHeight,
        left: `calc(50% - ${renderedWidth / 2}px + ${offsetX * maxOffsetX}px)`,
        top: `calc(50% - ${renderedHeight / 2}px + ${offsetY * maxOffsetY}px)`,
      }
    : undefined;

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedImage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX,
      offsetY,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setOffsetX(
      clamp(
        dragStart.current.offsetX +
          (event.clientX - dragStart.current.pointerX) / Math.max(maxOffsetX, 1),
        -1,
        1,
      ),
    );
    setOffsetY(
      clamp(
        dragStart.current.offsetY +
          (event.clientY - dragStart.current.pointerY) / Math.max(maxOffsetY, 1),
        -1,
        1,
      ),
    );
  };

  return (
    <div className="cloudinary-image-field">
      {fieldName && <input name={fieldName} type="hidden" value={value} />}
      {required && !value && (
        <span className="admin-upload-required">Upload an image before saving.</span>
      )}
      {value && (
        <Image
          alt="Uploaded image preview"
          className="admin-image-preview"
          height={140}
          src={value}
          style={{ aspectRatio: String(aspectRatio), height: "auto", maxHeight: "none" }}
          unoptimized
          width={200}
        />
      )}
      <label className="admin-upload-button">
        <input
          accept="image/*"
          aria-label="Choose image to crop and upload"
          disabled={uploading}
          onChange={handleFile}
          type="file"
        />
        {uploading
          ? "Uploading WebP…"
          : value
            ? "Replace image"
            : "Choose, crop and upload"}
      </label>
      <p className="admin-upload-help">
        Crop, compress and convert to WebP. Uploads directly to Cloudinary.
      </p>
      {error && (
        <p className="admin-upload-error" role="alert">
          {error}
        </p>
      )}

      {selectedImage && (
        <div className="image-crop-backdrop">
          <section
            aria-labelledby="image-crop-title"
            aria-modal="true"
            className="image-crop-dialog"
            role="dialog"
          >
            <div className="image-crop-heading">
              <div>
                <h2 id="image-crop-title">Crop and adjust image</h2>
                <p>Drag the image to position it inside the crop frame.</p>
              </div>
              <button
                aria-label="Close crop editor"
                className="admin-text-button"
                disabled={uploading}
                onClick={closeCropper}
                type="button"
              >
                Close ×
              </button>
            </div>
            <div
              className="image-crop-viewport"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => {
                dragStart.current = null;
              }}
              ref={viewportRef}
              style={{ aspectRatio: String(aspectRatio) }}
            >
              <Image
                alt=""
                draggable={false}
                height={selectedImage.height}
                src={selectedImage.url}
                style={imageStyle}
                unoptimized
                width={selectedImage.width}
              />
              <span aria-hidden="true" className="image-crop-grid" />
            </div>
            <label className="image-crop-zoom">
              Zoom
              <input
                max="3"
                min="1"
                onChange={(event) => setZoom(Number(event.target.value))}
                step="0.01"
                type="range"
                value={zoom}
              />
            </label>
            <div className="image-crop-actions">
              <button
                className="admin-button"
                disabled={uploading}
                onClick={closeCropper}
                type="button"
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-primary"
                disabled={uploading}
                onClick={() => void confirmCrop()}
                type="button"
              >
                {uploading ? "Compressing and uploading…" : "Crop and upload WebP"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

type CloudinaryImageGalleryFieldProps = {
  value: string[];
  onChange: (value: string[]) => void;
  fieldName: string;
  maxItems?: number;
};

export function CloudinaryImageGalleryField({
  value,
  onChange,
  fieldName,
  maxItems = 3,
}: CloudinaryImageGalleryFieldProps) {
  const slots = Array.from({ length: maxItems }, (_, index) => value[index] ?? "");

  const updateSlot = (index: number, url: string) => {
    const next = [...slots];
    next[index] = url;
    while (next[next.length - 1] === "") next.pop();
    onChange(next);
  };

  return (
    <div className="cloudinary-gallery-field">
      <input name={fieldName} type="hidden" value={slots.filter(Boolean).join("\n")} />
      {slots.map((url, index) => (
        <div className="cloudinary-gallery-item" key={`${fieldName}-${index}`}>
          <span className="cloudinary-gallery-label">Detail image {index + 1}</span>
          <CloudinaryImageField
            fieldName={`${fieldName}-${index + 1}`}
            onChange={(nextUrl) => updateSlot(index, nextUrl)}
            value={url}
          />
          {url && (
            <button
              aria-label={`Remove detail image ${index + 1}`}
              className="admin-text-button danger"
              onClick={() => updateSlot(index, "")}
              type="button"
            >
              Remove image
            </button>
          )}
        </div>
      ))}
      <small className="admin-field-help">
        Upload up to {maxItems} additional images. Empty slots appear as placeholders on
        the project detail page.
      </small>
    </div>
  );
}
