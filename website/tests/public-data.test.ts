import { describe, expect, it } from "vitest";
import { uploadPublicImage } from "../src/lib/cloudinary/upload-image";
import {
  LeadInputSchema,
  NewsletterInputSchema,
} from "../src/lib/data/schemas";

describe("public request validation", () => {
  it("requires valid bounded lead and newsletter fields", () => {
    expect(
      LeadInputSchema.safeParse({
        name: "Kitari Client",
        email: "client@example.com",
        projectType: "Website",
        message: "I need a new website.",
      }).success,
    ).toBe(true);
    expect(
      LeadInputSchema.safeParse({
        name: "x".repeat(121),
        email: "not-an-email",
        projectType: "",
        message: "Hello",
      }).success,
    ).toBe(false);
    expect(
      NewsletterInputSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects unsupported and oversized files before network upload", async () => {
    const unsupported = new File(["svg"], "image.svg", {
      type: "image/svg+xml",
    });
    const oversized = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "large.png",
      { type: "image/png" },
    );

    await expect(uploadPublicImage(unsupported)).rejects.toThrow(
      "Choose a JPG, PNG, or WebP image.",
    );
    await expect(uploadPublicImage(oversized)).rejects.toThrow(
      "Image files must be no larger than 5 MB.",
    );
  });
});
