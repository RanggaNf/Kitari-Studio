import { z } from "zod";

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const LeadInputSchema = z.object({
  name: boundedText(120),
  email: z.email().max(254),
  projectType: boundedText(80),
  message: boundedText(4000),
  website: z.string().max(500).optional(),
});

export const LeadDocumentSchema = LeadInputSchema.omit({ website: true }).extend({
  status: z.literal("New"),
  createdAt: z.unknown(),
});

export const NewsletterInputSchema = z.object({
  email: z.email().max(254),
  website: z.string().max(500).optional(),
});

export const NewsletterDocumentSchema = NewsletterInputSchema.omit({
  website: true,
}).extend({
  createdAt: z.unknown(),
});

export const PublishedStatusSchema = z.object({
  status: z.literal("Published"),
  order: z.number().int().nonnegative(),
});

export const SiteSettingsSchema = z.object({
  title: boundedText(120),
  location: boundedText(160),
  email: z.email().max(254),
  phone: boundedText(40),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9\s()-]{7,24}$/)
    .or(z.literal(""))
    .optional(),
  heroTagline: boundedText(500),
  heroCard1: z.union([z.url(), z.literal("")]).optional(),
  heroCard2: z.union([z.url(), z.literal("")]).optional(),
  heroCard3: z.union([z.url(), z.literal("")]).optional(),
  heroCard4: z.union([z.url(), z.literal("")]).optional(),
  heroCard5: z.union([z.url(), z.literal("")]).optional(),
  heroCard6: z.union([z.url(), z.literal("")]).optional(),
  heroCard7: z.union([z.url(), z.literal("")]).optional(),
  heroCard8: z.union([z.url(), z.literal("")]).optional(),
  heroCard9: z.union([z.url(), z.literal("")]).optional(),
  heroCard10: z.union([z.url(), z.literal("")]).optional(),
  aboutText: boundedText(4000),
  aboutImage: z.union([z.url(), z.literal("")]).optional(),
  aboutImageAlt: z.string().max(200).optional(),
  aboutStat1Value: z.string().max(40).optional(),
  aboutStat1Label: z.string().max(120).optional(),
  aboutStat2Value: z.string().max(40).optional(),
  aboutStat2Label: z.string().max(120).optional(),
  aboutStat3Value: z.string().max(40).optional(),
  aboutStat3Label: z.string().max(120).optional(),
  aboutStat4Value: z.string().max(40).optional(),
  aboutStat4Label: z.string().max(120).optional(),
  homeNavHome: z.string().max(80).optional(),
  homeNavAbout: z.string().max(80).optional(),
  homeNavServices: z.string().max(80).optional(),
  homeNavWork: z.string().max(80).optional(),
  homeNavCatalogue: z.string().max(80).optional(),
  homeNavTestimonials: z.string().max(80).optional(),
  homeNavFaq: z.string().max(80).optional(),
  homeScheduleCall: z.string().max(100).optional(),
  homeCatalogueEyebrow: z.string().max(100).optional(),
  homeCatalogueTitle: z.string().max(180).optional(),
  homeBookCall: z.string().max(100).optional(),
  homeStartingPrice: z.string().max(80).optional(),
  homeAboutEyebrow: z.string().max(100).optional(),
  homeServicesEyebrow: z.string().max(100).optional(),
  homeServicesTitle: z.string().max(180).optional(),
  homeServicesDescription: z.string().max(500).optional(),
  homeWorkEyebrow: z.string().max(100).optional(),
  homeWorkTitle: z.string().max(180).optional(),
  homeWorkDescription: z.string().max(500).optional(),
  homeProjectDetails: z.string().max(100).optional(),
  homeSeeAllWork: z.string().max(100).optional(),
  homeTestimonialsTitle: z.string().max(180).optional(),
  homeTestimonialsDescription: z.string().max(500).optional(),
  homeFaqEyebrow: z.string().max(100).optional(),
  homeFaqTitle: z.string().max(180).optional(),
  homeFaqDescription: z.string().max(500).optional(),
  homeCtaHeading: z.string().max(500).optional(),
  homeCtaWorkLink: z.string().max(100).optional(),
  homeFooterDescription: z.string().max(500).optional(),
  homeFooterPagesHeading: z.string().max(80).optional(),
  homeFooterHomeLink: z.string().max(80).optional(),
  homeFooterServicesLink: z.string().max(80).optional(),
  homeFooterPortfolioLink: z.string().max(80).optional(),
  homeFooterWhiteLabelLink: z.string().max(80).optional(),
  homeFooterRecentWorksHeading: z.string().max(80).optional(),
  homeFooterRecentWork1: z.string().max(100).optional(),
  homeFooterRecentWork2: z.string().max(100).optional(),
  homeFooterRecentWork3: z.string().max(100).optional(),
  homeFooterRecentWork4: z.string().max(100).optional(),
  homeFooterSocialsHeading: z.string().max(80).optional(),
  homeFooterInstagram: z.string().max(80).optional(),
  homeFooterLinkedIn: z.string().max(80).optional(),
  homeFooterTikTok: z.string().max(80).optional(),
  homeFooterFacebook: z.string().max(80).optional(),
  homeFooterYouTube: z.string().max(80).optional(),
  homeFooterLocationHeading: z.string().max(80).optional(),
  homeFooterNewsletterHeading: z.string().max(80).optional(),
  homeFooterEmailLabel: z.string().max(80).optional(),
  homeFooterEmailPlaceholder: z.string().max(120).optional(),
  homeFooterSubscribeLabel: z.string().max(80).optional(),
  homeFooterNewsletterPolicy: z.string().max(200).optional(),
  homeFooterNewsletterSuccess: z.string().max(200).optional(),
  homeFooterInquiryHeading: z.string().max(80).optional(),
  homeFooterOpenPositionHeading: z.string().max(80).optional(),
  homeFooterOpenPosition1: z.string().max(120).optional(),
  homeFooterOpenPosition2: z.string().max(120).optional(),
  homeFooterCopyright: z.string().max(200).optional(),
  instagramUrl: z.union([z.url(), z.literal("")]).optional(),
  linkedinUrl: z.union([z.url(), z.literal("")]).optional(),
  facebookUrl: z.union([z.url(), z.literal("")]).optional(),
  tiktokUrl: z.union([z.url(), z.literal("")]).optional(),
  siteFontFamily: z.enum(["Geist", "Arial", "Georgia", "system-ui"]).optional(),
  siteTextScale: z.number().min(0.85).max(1.2).optional(),
  siteHeadingScale: z.number().min(0.8).max(1.3).optional(),
  siteBodyScale: z.number().min(0.8).max(1.3).optional(),
  siteNavScale: z.number().min(0.8).max(1.3).optional(),
  siteButtonScale: z.number().min(0.8).max(1.3).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;
export type NewsletterInput = z.infer<typeof NewsletterInputSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
