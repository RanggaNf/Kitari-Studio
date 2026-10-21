import type { Metadata } from "next";
import Image from "next/image";
import { SiteNavigation } from "@/components/site-navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PillLink } from "@/components/ui/pill-link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Tag } from "@/components/ui/tag";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

export const metadata: Metadata = {
  title: "Styleguide",
  description: "Internal design system preview for Kitari Studio.",
  robots: {
    index: false,
    follow: false,
  },
};

const colors = [
  { name: "Background", value: "#080808", className: "bg-[#080808]" },
  { name: "Surface", value: "#0e0e0e", className: "bg-[#0e0e0e]" },
  { name: "Primary", value: "#6047ff", className: "bg-[#6047ff]" },
  { name: "Secondary", value: "#33258c", className: "bg-[#33258c]" },
];

export default function StyleguidePage() {
  return (
    <>
      <SiteNavigation />
      <main>
        <section className="border-b border-white/10 py-20 sm:py-28">
          <Container className="grid gap-6">
            <Eyebrow>Internal · Phase 01</Eyebrow>
            <h1 className="max-w-4xl text-5xl font-medium leading-[1.02] tracking-[-0.06em] sm:text-7xl">
              Kitari Studio design system
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              Shared colors, type, spacing, and interface building blocks for the public
              website and admin experience.
            </p>
          </Container>
        </section>

        <Container className="grid gap-16 py-16 sm:gap-20 sm:py-20">
          <section aria-labelledby="color-heading" className="grid gap-6">
            <SectionHeading
              description="Core palette from the approved visual direction."
              id="color-heading"
              title="Color tokens"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colors.map((color) => (
                <SurfaceCard className="p-3" key={color.name}>
                  <div
                    aria-label={`${color.name} color swatch`}
                    className={`h-28 rounded-md border border-white/10 ${color.className}`}
                  />
                  <div className="flex justify-between gap-4 px-2 pb-2 pt-4 text-sm">
                    <span>{color.name}</span>
                    <code className="text-muted">{color.value}</code>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </section>

          <section aria-labelledby="type-heading" className="grid gap-6">
            <SectionHeading
              description="Geist is the shared typeface; scale follows the prototype."
              id="type-heading"
              title="Typography"
            />
            <SurfaceCard className="grid gap-8 p-6 sm:p-8">
              <div>
                <p className="mb-3 text-sm text-muted">Display · 56 / 60 · Medium</p>
                <p className="text-5xl font-medium leading-[1.05] tracking-[-0.06em]">
                  Made to grow with you.
                </p>
              </div>
              <div>
                <p className="mb-3 text-sm text-muted">Heading · 32 / 40 · Medium</p>
                <p className="text-3xl font-medium tracking-[-0.04em]">
                  Thoughtful by design.
                </p>
              </div>
              <div>
                <p className="mb-3 text-sm text-muted">Body · 16 / 24 · Regular</p>
                <p className="max-w-2xl text-base leading-6 text-muted">
                  We build brands and digital products for startups and growing
                  businesses, with every detail made to look good and work well.
                </p>
              </div>
            </SurfaceCard>
          </section>

          <section aria-labelledby="components-heading" className="grid gap-6">
            <SectionHeading
              description="Reusable, accessible components for common actions and content."
              id="components-heading"
              title="Components"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <SurfaceCard className="grid content-start gap-6 p-6 sm:p-8">
                <h3 className="text-lg font-medium">Actions and labels</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <PillLink href="#components-heading">Book a Call</PillLink>
                  <Button type="button" variant="secondary">
                    Secondary action
                  </Button>
                  <TextLink href="#color-heading">Explore our work ↗</TextLink>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag>Branding</Tag>
                  <Tag>Website</Tag>
                  <Tag>Mobile App</Tag>
                </div>
              </SurfaceCard>

              <SurfaceCard className="grid content-start gap-6 p-6 sm:p-8">
                <h3 className="text-lg font-medium">Form field</h3>
                <TextField
                  autoComplete="email"
                  id="styleguide-email"
                  label="Email address"
                  placeholder="you@example.com"
                  type="email"
                />
                <p className="text-sm leading-6 text-muted">
                  Labels stay visible and linked to their inputs for accessibility.
                </p>
              </SurfaceCard>

              <SurfaceCard className="grid overflow-hidden lg:col-span-2 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-64">
                  <Image
                    alt="SaaS dashboard interface preview"
                    className="object-cover"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    src={cloudinaryImage("rectangle-32.webp")}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-[#080808]/90 p-4">
                    <Tag>Branding</Tag>
                    <Tag>Website</Tag>
                    <Tag>Mobile App</Tag>
                  </div>
                </div>
                <div className="grid content-center gap-4 p-6 sm:p-8">
                  <Eyebrow>Reusable card</Eyebrow>
                  <h3 className="text-2xl font-medium tracking-[-0.04em]">
                    Project preview
                  </h3>
                  <p className="leading-6 text-muted">
                    Image, content, and editable service tags remain separate elements.
                  </p>
                </div>
              </SurfaceCard>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}

function SectionHeading({
  description,
  id,
  title,
}: {
  description: string;
  id: string;
  title: string;
}) {
  return (
    <div className="grid gap-2">
      <h2 className="text-2xl font-medium tracking-[-0.04em]" id={id}>
        {title}
      </h2>
      <p className="max-w-2xl leading-6 text-muted">{description}</p>
    </div>
  );
}
