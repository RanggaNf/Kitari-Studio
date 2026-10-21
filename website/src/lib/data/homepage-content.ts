import { z } from "zod";
import {
  getPublicSiteSettings,
  getPublishedCollection,
  type PublicCollection,
} from "./public-data";
import { SiteSettingsSchema } from "./schemas";
import type { SiteSettings } from "./schemas";
import { slugifyProjectTitle } from "./projects";

const text = z.string().trim().min(1);
const publishedFields = {
  status: z.literal("Published"),
  order: z.number().int().nonnegative(),
};

const catalogueSchema = z
  .object({
    name: text.optional(),
    title: text.optional(),
    price: text,
    img: text,
    ...publishedFields,
  })
  .transform((item) => ({ ...item, name: item.name ?? item.title ?? "" }))
  .pipe(
    z.object({
      name: text,
      price: text,
      img: text,
      ...publishedFields,
    }),
  );

const serviceSchema = z
  .object({
    name: text,
    desc: text.optional(),
    description: text.optional(),
    img: text,
    background: z.union([z.url(), z.literal("")]).optional(),
    ...publishedFields,
  })
  .transform((item) => ({ ...item, desc: item.desc ?? item.description ?? "" }))
  .pipe(
    z.object({
      name: text,
      desc: text,
      img: text,
      background: z.union([z.url(), z.literal("")]).optional(),
      ...publishedFields,
    }),
  );

export const projectSchema = z
  .object({
    title: text.optional(),
    name: text.optional(),
    slug: z.string().optional(),
    country: text,
    year: text,
    tagsList: z.array(text).optional(),
    tags: z.array(text).optional(),
    desc: text.optional(),
    description: text.optional(),
    img: text,
    imageAlt: z.string().optional(),
    client: z.string().optional(),
    clientComment: z.string().optional(),
    overview: z.string().optional(),
    challenge: z.string().optional(),
    solution: z.string().optional(),
    outcome: z.string().optional(),
    websiteUrl: z.union([z.url(), z.literal("")]).optional(),
    gallery: z.array(text).optional(),
    featured: z.boolean().optional(),
    stage: z.enum(["Completed", "Coming soon"]).optional(),
    ...publishedFields,
  })
  .transform((item) => {
    const title = item.title ?? item.name ?? "";
    return {
      ...item,
      title,
      slug: slugifyProjectTitle(item.slug || title),
      desc: item.desc ?? item.description ?? "",
      tagsList: item.tagsList ?? item.tags ?? [],
      imageAlt: item.imageAlt ?? "",
      client: item.client ?? "",
      clientComment: item.clientComment ?? "",
      overview: item.overview ?? "",
      challenge: item.challenge ?? "",
      solution: item.solution ?? "",
      outcome: item.outcome ?? "",
      websiteUrl: item.websiteUrl ?? "",
      gallery: item.gallery ?? [],
      featured: item.featured ?? false,
      stage: item.stage ?? "Completed",
    };
  })
  .pipe(
    z.object({
      title: text,
      slug: text,
      country: text,
      year: text,
      tagsList: z.array(text),
      desc: text,
      img: text,
      imageAlt: z.string(),
      client: z.string(),
      clientComment: z.string(),
      overview: z.string(),
      challenge: z.string(),
      solution: z.string(),
      outcome: z.string(),
      websiteUrl: z.union([z.url(), z.literal("")]),
      gallery: z.array(text),
      featured: z.boolean(),
      stage: z.enum(["Completed", "Coming soon"]),
      ...publishedFields,
    }),
  );

const testimonialSchema = z.object({
  name: text,
  company: text,
  quote: text,
  photo: z.string(),
  ...publishedFields,
});

const faqSchema = z
  .object({
    q: text.optional(),
    question: text.optional(),
    ans: text.optional(),
    answer: text.optional(),
    ...publishedFields,
  })
  .transform((item) => ({
    ...item,
    q: item.q ?? item.question ?? "",
    ans: item.ans ?? item.answer ?? "",
  }))
  .pipe(
    z.object({
      q: text,
      ans: text,
      ...publishedFields,
    }),
  );

export type HomepageContent = {
  settings: SiteSettings;
  catalogue: z.output<typeof catalogueSchema>[];
  services: z.output<typeof serviceSchema>[];
  projects: z.output<typeof projectSchema>[];
  testimonials: z.output<typeof testimonialSchema>[];
  faqs: z.output<typeof faqSchema>[];
};

export type ProjectContent = z.output<typeof projectSchema>;

export async function loadPublishedProjects(): Promise<ProjectContent[]> {
  return getPublishedCollection("projects", projectSchema);
}

type HomepageFallback = {
  settings: SiteSettings;
  catalogue: HomepageContent["catalogue"];
  services: HomepageContent["services"];
  projects: HomepageContent["projects"];
  testimonials: HomepageContent["testimonials"];
  faqs: HomepageContent["faqs"];
};

async function withFallback<T>(
  collectionName: PublicCollection,
  fallback: T[],
  load: () => Promise<T[]>,
) {
  try {
    const content = await load();
    return content.length > 0 ? content : fallback;
  } catch (error) {
    console.error(
      `Could not load published ${collectionName}; keeping local fallback content.`,
      error,
    );
    return fallback;
  }
}

export async function loadHomepageContent(
  fallback: HomepageFallback,
): Promise<HomepageContent> {
  const [settings, catalogue, services, projects, testimonials, faqs] = await Promise.all(
    [
      getPublicSiteSettings().catch((error: unknown) => {
        console.error(
          "Could not load public site settings; keeping local fallback settings.",
          error,
        );
        return null;
      }),
      withFallback("catalogue", fallback.catalogue, () =>
        getPublishedCollection("catalogue", catalogueSchema),
      ),
      withFallback("services", fallback.services, () =>
        getPublishedCollection("services", serviceSchema),
      ),
      withFallback("projects", fallback.projects, () => loadPublishedProjects()),
      withFallback("testimonials", fallback.testimonials, () =>
        getPublishedCollection("testimonials", testimonialSchema),
      ),
      withFallback("faqs", fallback.faqs, () =>
        getPublishedCollection("faqs", faqSchema),
      ),
    ],
  );

  return {
    settings: settings ? SiteSettingsSchema.parse(settings) : fallback.settings,
    catalogue,
    services,
    projects,
    testimonials,
    faqs,
  };
}
