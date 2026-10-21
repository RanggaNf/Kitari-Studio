"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CloudinaryImageField,
  CloudinaryImageGalleryField,
} from "@/components/admin/cloudinary-image-field";
import { fallbackContent } from "@/data/homepage-fallback";
import {
  collectionFields,
  collectionLabels,
  deleteSubscriber,
  listContent,
  listLeads,
  listPublishedContentCounts,
  listSubscribers,
  loadSettings,
  managedCollections,
  removeContent,
  saveContent,
  saveSettings,
  updateLeadStatus,
  type ManagedCollection,
  type ManagedRecord,
} from "@/lib/firebase/admin-data";
import { signOutAdmin, useAdminSession } from "@/lib/firebase/admin-session";
import { SiteSettingsSchema } from "@/lib/data/schemas";
import { slugifyProjectTitle } from "@/lib/data/projects";

type Section =
  | "overview"
  | "analytics"
  | ManagedCollection
  | "leads"
  | "newsletter"
  | "about"
  | "homepage"
  | "appearance"
  | "settings";
type ContentStatusFilter = "all" | "published" | "draft";

const navItems: Array<{ id: Section; label: string; group: string }> = [
  { id: "overview", label: "Overview", group: "Workspace" },
  { id: "analytics", label: "Analytics", group: "Workspace" },
  { id: "about", label: "About section", group: "Content" },
  { id: "homepage", label: "Homepage text", group: "Content" },
  { id: "appearance", label: "Appearance", group: "Workspace" },
  { id: "projects", label: "Our work", group: "Content" },
  { id: "catalogue", label: "Catalogue", group: "Content" },
  { id: "services", label: "Services", group: "Content" },
  { id: "testimonials", label: "Testimonials", group: "Content" },
  { id: "faqs", label: "FAQs", group: "Content" },
  { id: "leads", label: "Leads", group: "Inbox" },
  { id: "newsletter", label: "Newsletter", group: "Inbox" },
  { id: "settings", label: "Site settings", group: "Workspace" },
];

const settingFields: Array<{
  name: string;
  label: string;
  type?: "textarea" | "email" | "url" | "image";
  optional?: boolean;
  aspectRatio?: number;
}> = [
  { name: "title", label: "Studio name" },
  { name: "location", label: "Location" },
  { name: "email", label: "Contact email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "whatsapp", label: "WhatsApp number (international format)", optional: true },
  { name: "heroTagline", label: "Hero tagline", type: "textarea" },
  { name: "instagramUrl", label: "Instagram URL", type: "url", optional: true },
  { name: "linkedinUrl", label: "LinkedIn URL", type: "url", optional: true },
  { name: "facebookUrl", label: "Facebook URL", type: "url", optional: true },
  { name: "tiktokUrl", label: "TikTok URL", type: "url", optional: true },
] as const;

const appearanceFields: Array<{
  name: string;
  label: string;
  type: "select" | "number";
  options?: string[];
  minimum?: number;
  maximum?: number;
  step?: number;
}> = [
  {
    name: "siteFontFamily",
    label: "Website font",
    type: "select",
    options: ["Geist", "Arial", "Georgia", "system-ui"],
  },
  {
    name: "siteTextScale",
    label: "Global text size scale (0.85–1.20)",
    type: "number",
    minimum: 0.85,
    maximum: 1.2,
    step: 0.05,
  },
  {
    name: "siteHeadingScale",
    label: "Headings scale (0.80–1.30)",
    type: "number",
    minimum: 0.8,
    maximum: 1.3,
    step: 0.05,
  },
  {
    name: "siteBodyScale",
    label: "Paragraphs and body text scale (0.80–1.30)",
    type: "number",
    minimum: 0.8,
    maximum: 1.3,
    step: 0.05,
  },
  {
    name: "siteNavScale",
    label: "Navigation and footer links scale (0.80–1.30)",
    type: "number",
    minimum: 0.8,
    maximum: 1.3,
    step: 0.05,
  },
  {
    name: "siteButtonScale",
    label: "Buttons and actions scale (0.80–1.30)",
    type: "number",
    minimum: 0.8,
    maximum: 1.3,
    step: 0.05,
  },
];

const aboutFields: Array<{
  name: string;
  label: string;
  type?: "textarea" | "image";
  optional?: boolean;
  aspectRatio?: number;
}> = [
  { name: "aboutText", label: "About the studio", type: "textarea" },
  {
    name: "aboutImage",
    label: "About center image",
    type: "image",
    optional: true,
    aspectRatio: 335 / 200,
  },
  { name: "aboutImageAlt", label: "About image description", optional: true },
  { name: "aboutStat1Value", label: "About statistic 1 — number" },
  { name: "aboutStat1Label", label: "About statistic 1 — description" },
  { name: "aboutStat2Value", label: "About statistic 2 — number" },
  { name: "aboutStat2Label", label: "About statistic 2 — description" },
  { name: "aboutStat3Value", label: "About statistic 3 — number" },
  { name: "aboutStat3Label", label: "About statistic 3 — description" },
  { name: "aboutStat4Value", label: "About statistic 4 — number" },
  { name: "aboutStat4Label", label: "About statistic 4 — description" },
] as const;

const homepageTextFields: Array<{
  name: string;
  label: string;
  type?: "textarea" | "image";
  optional?: boolean;
  aspectRatio?: number;
}> = [
  { name: "homeNavHome", label: "Navigation — Home" },
  { name: "homeNavAbout", label: "Navigation — About" },
  { name: "homeNavServices", label: "Navigation — Services" },
  { name: "homeNavWork", label: "Navigation — Our work" },
  { name: "homeNavCatalogue", label: "Navigation — Catalogue" },
  { name: "homeNavTestimonials", label: "Navigation — Testimonials" },
  { name: "homeNavFaq", label: "Navigation — FAQ" },
  { name: "homeScheduleCall", label: "Navigation — Schedule a call" },
  { name: "homeCatalogueEyebrow", label: "Catalogue — Small heading" },
  { name: "homeCatalogueTitle", label: "Catalogue — Main heading" },
  { name: "homeBookCall", label: "Catalogue/About — Book a call" },
  { name: "homeStartingPrice", label: "Catalogue — Starting price label" },
  { name: "homeAboutEyebrow", label: "About — Small heading" },
  { name: "homeServicesEyebrow", label: "Services — Small heading" },
  { name: "homeServicesTitle", label: "Services — Main heading" },
  { name: "homeServicesDescription", label: "Services — Description", type: "textarea" },
  { name: "homeWorkEyebrow", label: "Our work — Small heading" },
  { name: "homeWorkTitle", label: "Our work — Main heading" },
  { name: "homeWorkDescription", label: "Our work — Description", type: "textarea" },
  { name: "homeProjectDetails", label: "Our work — Project link" },
  { name: "homeSeeAllWork", label: "Our work — See all work link" },
  { name: "homeTestimonialsTitle", label: "Testimonials — Main heading" },
  {
    name: "homeTestimonialsDescription",
    label: "Testimonials — Description",
    type: "textarea",
  },
  { name: "homeFaqEyebrow", label: "FAQ — Small heading" },
  { name: "homeFaqTitle", label: "FAQ — Main heading" },
  { name: "homeFaqDescription", label: "FAQ — Description", type: "textarea" },
  { name: "homeCtaHeading", label: "Contact CTA — Heading", type: "textarea" },
  { name: "homeCtaWorkLink", label: "Contact CTA — Work link" },
  {
    name: "homeFooterDescription",
    label: "Footer — Studio description",
    type: "textarea",
  },
  { name: "homeFooterPagesHeading", label: "Footer — Pages heading" },
  { name: "homeFooterHomeLink", label: "Footer — Home link" },
  { name: "homeFooterServicesLink", label: "Footer — Services link" },
  { name: "homeFooterPortfolioLink", label: "Footer — Portfolio link" },
  { name: "homeFooterWhiteLabelLink", label: "Footer — White label link" },
  { name: "homeFooterRecentWorksHeading", label: "Footer — Recent works heading" },
  { name: "homeFooterRecentWork1", label: "Footer — Recent work 1" },
  { name: "homeFooterRecentWork2", label: "Footer — Recent work 2" },
  { name: "homeFooterRecentWork3", label: "Footer — Recent work 3" },
  { name: "homeFooterRecentWork4", label: "Footer — Recent work 4" },
  { name: "homeFooterSocialsHeading", label: "Footer — Socials heading" },
  { name: "homeFooterInstagram", label: "Footer — Instagram label" },
  { name: "homeFooterLinkedIn", label: "Footer — LinkedIn label" },
  { name: "homeFooterTikTok", label: "Footer — TikTok label" },
  { name: "homeFooterFacebook", label: "Footer — Facebook label" },
  { name: "homeFooterYouTube", label: "Footer — YouTube label" },
  { name: "homeFooterLocationHeading", label: "Footer — Location heading" },
  { name: "homeFooterNewsletterHeading", label: "Footer — Newsletter heading" },
  {
    name: "homeFooterEmailLabel",
    label: "Footer — Newsletter email accessibility label",
  },
  { name: "homeFooterEmailPlaceholder", label: "Footer — Newsletter email placeholder" },
  {
    name: "homeFooterSubscribeLabel",
    label: "Footer — Newsletter submit accessibility label",
  },
  { name: "homeFooterNewsletterPolicy", label: "Footer — Newsletter policy text" },
  { name: "homeFooterNewsletterSuccess", label: "Footer — Newsletter success message" },
  { name: "homeFooterInquiryHeading", label: "Footer — Inquiry heading" },
  { name: "homeFooterOpenPositionHeading", label: "Footer — Open position heading" },
  { name: "homeFooterOpenPosition1", label: "Footer — Open position 1" },
  { name: "homeFooterOpenPosition2", label: "Footer — Open position 2" },
  { name: "homeFooterCopyright", label: "Footer — Copyright text" },
];
const homepageHeroCardFields: typeof homepageTextFields = Array.from(
  { length: 10 },
  (_, index) => ({
    name: `heroCard${index + 1}`,
    label: `Hero card ${index + 1} — Image`,
    type: "image",
    optional: true,
    aspectRatio: 180 / 220,
  }),
);
const homepageFields = [...homepageTextFields, ...homepageHeroCardFields];
const homepageTextGroupHeadings: Record<number, string> = {
  0: "Navigation",
  8: "Catalogue",
  12: "About section",
  13: "Services",
  16: "Our work",
  21: "Testimonials",
  23: "Frequently asked questions",
  26: "Contact call to action",
  28: "Footer",
  57: "Moving hero cards",
};

function text(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toLocaleString();
  }
  return value == null ? "" : String(value);
}

function timeValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function csvCell(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: ManagedRecord[]) {
  if (rows.length === 0) throw new Error("There are no records to export.");
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter(
    (column) => column !== "id",
  );
  const csv = [
    ["id", ...columns].map(csvCell).join(","),
    ...rows.map((row) =>
      [row.id, ...columns.map((column) => row[column])].map(csvCell).join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function AdminPage() {
  const router = useRouter();
  const session = useAdminSession();
  const [section, setSection] = useState<Section>("overview");
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [counts, setCounts] = useState<
    Record<ManagedCollection, { total: number; published: number }>
  >({
    projects: { total: 0, published: 0 },
    catalogue: { total: 0, published: 0 },
    services: { total: 0, published: 0 },
    testimonials: { total: 0, published: 0 },
    faqs: { total: 0, published: 0 },
  });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [overviewStats, setOverviewStats] = useState({
    leads: 0,
    newLeads: 0,
    subscribers: 0,
  });
  const [leadPipeline, setLeadPipeline] = useState({
    New: 0,
    Contacted: 0,
    Won: 0,
  });
  const [search, setSearch] = useState("");
  const [contentStatusFilter, setContentStatusFilter] =
    useState<ContentStatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<ManagedRecord | null>(null);
  const [leadDetails, setLeadDetails] = useState<ManagedRecord | null>(null);

  useEffect(() => {
    if (!session.loading && (!session.user || !session.isAdmin)) {
      router.replace("/admin/login");
    }
  }, [router, session.isAdmin, session.loading, session.user]);

  const loadSection = useCallback(async () => {
    if (!session.isAdmin) return;
    setLoading(true);
    setError("");
    try {
      if (managedCollections.some((collection) => collection === section)) {
        setRecords(await listContent(section as ManagedCollection, search));
      } else if (section === "leads") {
        setRecords(await listLeads(search));
      } else if (section === "newsletter") {
        setRecords(await listSubscribers(search));
      } else if (
        section === "settings" ||
        section === "about" ||
        section === "homepage" ||
        section === "appearance"
      ) {
        const value = await loadSettings();
        const fields =
          section === "about"
            ? aboutFields
            : section === "homepage"
              ? homepageFields
              : section === "appearance"
                ? appearanceFields
                : settingFields;
        setSettings(
          Object.fromEntries(
            fields.map(({ name }) => [
              name,
              text(
                value[name] ??
                  fallbackContent.settings[name as keyof typeof fallbackContent.settings],
              ),
            ]),
          ),
        );
      } else if (section === "overview") {
        const [nextCounts, leads, subscribers] = await Promise.all([
          listPublishedContentCounts(),
          listLeads(),
          listSubscribers(),
        ]);
        setCounts(nextCounts);
        setOverviewStats({
          leads: leads.length,
          newLeads: leads.filter((lead) => lead.status === "New").length,
          subscribers: subscribers.length,
        });
        setLeadPipeline({
          New: leads.filter((lead) => lead.status === "New").length,
          Contacted: leads.filter((lead) => lead.status === "Contacted").length,
          Won: leads.filter((lead) => lead.status === "Won").length,
        });
        const activity: ManagedRecord[] = [
          ...leads.slice(0, 6).map((lead) => ({ ...lead, recordType: "Lead" })),
          ...subscribers.slice(0, 4).map((item) => ({
            ...item,
            recordType: "Subscriber",
          })),
        ];
        activity.sort(
          (first, second) => timeValue(second.createdAt) - timeValue(first.createdAt),
        );
        setRecords(activity);
      }
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [search, section, session.isAdmin]);

  useEffect(() => {
    void Promise.resolve().then(loadSection);
  }, [loadSection]);

  const title = useMemo(
    () => navItems.find((item) => item.id === section)?.label ?? "Admin",
    [section],
  );

  function selectSection(next: Section) {
    setSection(next);
    setSearch("");
    setContentStatusFilter("all");
    setEditor(null);
    setLeadDetails(null);
    setNotice("");
    setError("");
  }

  async function handleLogout() {
    try {
      await signOutAdmin();
      router.replace("/admin/login");
    } catch (reason) {
      setError(formatError(reason));
    }
  }

  async function handleDelete(record: ManagedRecord) {
    if (
      !window.confirm(
        `Delete "${text(record.title ?? record.name ?? record.q ?? record.id)}"? This cannot be undone.`,
      )
    )
      return;
    setSaving(true);
    setError("");
    try {
      if (managedCollections.some((name) => name === section)) {
        await removeContent(section as ManagedCollection, record.id);
      } else if (section === "newsletter") {
        await deleteSubscriber(record.id);
      } else {
        throw new Error("This record cannot be deleted from this view.");
      }
      setNotice("Record deleted.");
      await loadSection();
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  if (session.loading || (!session.isAdmin && !session.error)) {
    return <main className="admin-loading">Verifying administrator access…</main>;
  }
  if (session.error) {
    return (
      <main className="admin-loading">
        <p className="admin-alert admin-alert-error">{session.error}</p>
        <button className="admin-button" onClick={() => router.replace("/admin/login")}>
          Return to sign in
        </button>
      </main>
    );
  }

  const isContentSection = managedCollections.some((name) => name === section);
  const visibleContentRecords = records.filter((record) => {
    if (contentStatusFilter === "all") return true;
    return String(record.status ?? "").toLowerCase() === contentStatusFilter;
  });
  const publishedContentCount = records.filter(
    (record) => String(record.status ?? "").toLowerCase() === "published",
  ).length;
  const draftContentCount = records.filter(
    (record) => String(record.status ?? "").toLowerCase() === "draft",
  ).length;
  const appearanceFontFamily =
    settings.siteFontFamily === "Geist"
      ? "var(--font-geist-sans), system-ui, sans-serif"
      : settings.siteFontFamily === "Georgia"
        ? "Georgia, serif"
        : settings.siteFontFamily === "Arial"
          ? "Arial, Helvetica, sans-serif"
          : "system-ui, sans-serif";
  const appearanceTextScale = Number(settings.siteTextScale || 1);
  const appearanceHeadingScale = Number(settings.siteHeadingScale || 1);
  const appearanceBodyScale = Number(settings.siteBodyScale || 1);
  const appearanceNavScale = Number(settings.siteNavScale || 1);
  const appearanceButtonScale = Number(settings.siteButtonScale || 1);

  async function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isContentSection) return;
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const field of collectionFields[section as ManagedCollection]) {
      const raw = String(formData.get(field.name) ?? "").trim();
      values[field.name] =
        field.type === "checkbox"
          ? formData.get(field.name) === "on"
          : field.type === "tags"
            ? raw
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : field.type === "gallery"
              ? raw
                  .split(/[\n,]/)
                  .map((url) => url.trim())
                  .filter(Boolean)
              : raw;
    }
    if (section === "projects" && typeof values.slug === "string" && !values.slug) {
      values.slug = slugifyProjectTitle(String(values.title ?? ""));
    }
    values.order = Number(formData.get("order"));
    values.status = String(formData.get("status"));
    if (!Number.isInteger(values.order) || Number(values.order) < 0) {
      setError("Order must be a whole number greater than or equal to zero.");
      return;
    }
    if (
      Object.entries(values).some(
        ([key, value]) =>
          key !== "order" &&
          key !== "status" &&
          !collectionFields[section as ManagedCollection].find(
            (field) => field.name === key,
          )?.optional &&
          typeof value === "string" &&
          !value.trim(),
      )
    ) {
      setError("Complete all required fields before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveContent(section as ManagedCollection, editor?.id ?? null, values);
      setEditor(null);
      setNotice("Content saved successfully.");
      await loadSection();
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  async function saveSiteSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fields =
      section === "about"
        ? aboutFields
        : section === "homepage"
          ? homepageFields
          : section === "appearance"
            ? appearanceFields
            : settingFields;
    const value = Object.fromEntries(
      fields.map(({ name, type }) => {
        const raw = String(formData.get(name) ?? "").trim();
        return [name, type === "number" ? Number(raw) : raw];
      }),
    );
    let currentValue: Record<string, unknown>;
    try {
      currentValue = await loadSettings();
    } catch (reason) {
      setError(formatError(reason));
      return;
    }
    const parsed = SiteSettingsSchema.safeParse({
      ...fallbackContent.settings,
      ...currentValue,
      ...value,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the settings and try again.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveSettings(parsed.data);
      setSettings((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, String(item)]),
        ),
      }));
      setNotice(
        section === "about"
          ? "About section saved successfully."
          : section === "homepage"
            ? "Homepage text and hero cards saved successfully."
            : section === "appearance"
              ? "Appearance settings saved successfully."
              : "Site settings saved successfully.",
      );
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  async function changeLeadStatus(lead: ManagedRecord, status: string) {
    setSaving(true);
    setError("");
    try {
      await updateLeadStatus(lead.id, status);
      setNotice("Lead status updated.");
      await loadSection();
      setLeadDetails({ ...lead, status });
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  const groupNames = [...new Set(navItems.map((item) => item.group))];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          KITARI STUDIO<span>ADMIN</span>
        </Link>
        <nav aria-label="Admin navigation">
          {groupNames.map((group) => (
            <div className="admin-nav-group" key={group}>
              <p>{group}</p>
              {navItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.id}
                    className={
                      section === item.id ? "admin-nav-link active" : "admin-nav-link"
                    }
                    onClick={() => selectSection(item.id)}
                  >
                    <span aria-hidden="true">{navIcon(item.id)}</span>
                    {item.label}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-avatar">
            {(session.user?.email ?? "A")[0].toUpperCase()}
          </span>
          <span className="admin-user-email">{session.user?.email}</span>
          <button className="admin-logout" onClick={handleLogout} aria-label="Sign out">
            ↗
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">KITARI STUDIO / ADMIN</p>
            <h1>{title}</h1>
          </div>
          <div className="admin-topbar-actions">
            <a
              className="admin-button admin-button-quiet"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              View website ↗
            </a>
            <button
              className="admin-button admin-button-quiet admin-mobile-logout"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="admin-alert admin-alert-error">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="admin-alert admin-alert-success">
            {notice}
          </div>
        )}

        {section === "overview" && (
          <section className="admin-page-content admin-overview-content">
            <p className="admin-subtitle">
              A clear picture of your content and incoming enquiries.
            </p>
            <div className="admin-kpi-grid">
              <Kpi
                label="New leads"
                value={overviewStats.newLeads}
                note={`${overviewStats.leads} total enquiries`}
              />
              <Kpi
                label="Published content"
                value={Object.values(counts).reduce(
                  (sum, item) => sum + item.published,
                  0,
                )}
                note="Across all content sections"
              />
              <Kpi
                label="Draft content"
                value={Object.values(counts).reduce(
                  (sum, item) => sum + item.total - item.published,
                  0,
                )}
                note="Hidden from the public site"
              />
              <Kpi
                label="Subscribers"
                value={overviewStats.subscribers}
                note="Total newsletter records"
              />
            </div>
            <nav aria-label="Quick admin actions" className="admin-quick-actions">
              <button onClick={() => selectSection("projects")} type="button">
                <span aria-hidden="true">↗</span>
                <span>
                  <strong>Manage projects</strong>
                  <small>Update portfolio content</small>
                </span>
              </button>
              <button onClick={() => selectSection("about")} type="button">
                <span aria-hidden="true">◉</span>
                <span>
                  <strong>Edit About section</strong>
                  <small>Change images and studio details</small>
                </span>
              </button>
              <button onClick={() => selectSection("leads")} type="button">
                <span aria-hidden="true">↘</span>
                <span>
                  <strong>Review enquiries</strong>
                  <small>{overviewStats.newLeads} new leads to review</small>
                </span>
              </button>
            </nav>
            <div className="admin-overview-grid">
              <div className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Lead pipeline</h2>
                    <p>Current enquiry status across all leads</p>
                  </div>
                  <span>{overviewStats.leads} total</span>
                </div>
                <div className="admin-pipeline">
                  {(["New", "Contacted", "Won"] as const).map((status) => {
                    const count = leadPipeline[status];
                    const width = overviewStats.leads
                      ? Math.max((count / overviewStats.leads) * 100, count ? 4 : 0)
                      : 0;
                    return (
                      <div className="admin-pipeline-item" key={status}>
                        <div>
                          <StatusPill status={status} />
                          <strong>{count}</strong>
                        </div>
                        <div className={`admin-pipeline-track ${status.toLowerCase()}`}>
                          <i style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="admin-panel admin-overview-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Content health</h2>
                    <p>Published and draft items by section</p>
                  </div>
                </div>
                <div className="admin-health-list">
                  {managedCollections.map((collection) => {
                    const value = counts[collection];
                    const ratio = value.total ? (value.published / value.total) * 100 : 0;
                    return (
                      <div className="admin-health-row" key={collection}>
                        <span>{collectionLabels[collection]}</span>
                        <div className="admin-progress">
                          <i style={{ width: `${ratio}%` }} />
                        </div>
                        <small>
                          {value.published}/{value.total} published
                        </small>
                      </div>
                    );
                  })}
                </div>
                <div className="admin-analytics-note">
                  GA4 report access is not connected yet. Visitor and page-duration
                  metrics need a secure Analytics Data API connection.
                </div>
              </div>
            </div>
            <div className="admin-panel admin-activity-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Latest enquiries and newsletter sign-ups</p>
                </div>
                <button
                  className="admin-text-button"
                  onClick={() => selectSection("leads")}
                >
                  View leads →
                </button>
              </div>
              {loading ? (
                <Loading />
              ) : records.length === 0 ? (
                <Empty />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name / email</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((row) => (
                        <tr key={`${row.recordType}-${row.id}`}>
                          <td>{text(row.recordType)}</td>
                          <td>{text(row.name || row.email)}</td>
                          <td>{text(row.createdAt) || "—"}</td>
                          <td>
                            <StatusPill status={text(row.status || "Subscribed")} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {section === "analytics" && (
          <section className="admin-page-content admin-analytics-page">
            <div className="admin-analytics-intro">
              <p className="admin-subtitle">
                Understand visits and discover which pages attract the most attention.
              </p>
              <span className="admin-analytics-period">Last 28 days</span>
            </div>
            <div className="admin-analytics-connection" role="status">
              <span aria-hidden="true">i</span>
              <div>
                <strong>Secure GA4 reporting connection needed</strong>
                <p>
                  The GA4 tracking tag and this dashboard are separate. Connect the
                  Analytics Data API through a secure server backend to load real report
                  data here.
                </p>
              </div>
              <span className="admin-analytics-status">Setup required</span>
            </div>
            <div className="admin-analytics-stats">
              {[
                ["Active visitors", "—", "GA4 active users"],
                ["Page views", "—", "Views across all pages"],
                ["Avg. engagement", "—", "Per active visitor"],
              ].map(([label, value, note]) => (
                <article className="admin-kpi" key={label}>
                  <p>{label}</p>
                  <strong aria-label={`${label}: unavailable`}>{value}</strong>
                  <small>{note}</small>
                </article>
              ))}
            </div>
            <div className="admin-panel admin-page-heatmap">
              <div className="admin-panel-heading">
                <div>
                  <h2>Page popularity heatmap</h2>
                  <p>
                    Compare visitors, page views, and average engagement time by page.
                  </p>
                </div>
                <div
                  aria-label="Page view intensity: low to high"
                  className="admin-heatmap-legend"
                >
                  <span>Low</span>
                  <i />
                  <span>High</span>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-analytics-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Visitors</th>
                      <th>Page views</th>
                      <th>Avg. engagement</th>
                    </tr>
                  </thead>
                </table>
                <p className="admin-analytics-empty">
                  Page-level heatmap will appear when secure GA4 report access is
                  connected.
                </p>
              </div>
            </div>
          </section>
        )}

        {isContentSection && (
          <section className="admin-page-content">
            {!editor ? (
              <div className="admin-panel">
                <div className="admin-panel-heading admin-list-heading">
                  <div>
                    <h2>{title} items</h2>
                    <p>
                      {section === "services"
                        ? "Edit a service to set its background. The background field is available only when Display order is not 1."
                        : "Manage published content and drafts."}
                    </p>
                  </div>
                  <button
                    className="admin-button admin-button-primary"
                    onClick={() =>
                      setEditor(
                        section === "services" ? { id: "", order: 1 } : { id: "" },
                      )
                    }
                  >
                    + Add item
                  </button>
                </div>
                <div className="admin-toolbar">
                  <div className="admin-list-controls">
                    <input
                      className="admin-search"
                      type="search"
                      placeholder={`Search ${title.toLowerCase()}…`}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <div
                      aria-label="Filter content by status"
                      className="admin-filter-tabs"
                      role="group"
                    >
                      {(
                        [
                          ["all", `All ${records.length}`],
                          ["published", `Published ${publishedContentCount}`],
                          ["draft", `Drafts ${draftContentCount}`],
                        ] as const
                      ).map(([filter, label]) => (
                        <button
                          aria-pressed={contentStatusFilter === filter}
                          className={contentStatusFilter === filter ? "active" : ""}
                          key={filter}
                          onClick={() => setContentStatusFilter(filter)}
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span>{visibleContentRecords.length} shown</span>
                </div>
                {loading ? (
                  <Loading />
                ) : records.length === 0 ? (
                  <Empty />
                ) : visibleContentRecords.length === 0 ? (
                  <p className="admin-empty">
                    No {contentStatusFilter} items match this view. Try another status
                    filter.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Order</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleContentRecords.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <strong>
                                {text(row.title || row.name || row.q || row.id)}
                              </strong>
                              <small className="admin-cell-secondary">
                                {text(row.desc || row.ans || row.quote || row.price)}
                              </small>
                            </td>
                            <td>{text(row.order)}</td>
                            <td>
                              <StatusPill status={text(row.status)} />
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  className="admin-text-button"
                                  onClick={() => setEditor(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="admin-text-button danger"
                                  disabled={saving}
                                  onClick={() => void handleDelete(row)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="admin-panel admin-editor">
                <div className="admin-panel-heading">
                  <div>
                    <h2>{editor.id ? "Edit item" : "Create item"}</h2>
                    <p>Fields marked by the form are required.</p>
                  </div>
                  <button className="admin-text-button" onClick={() => setEditor(null)}>
                    Close ×
                  </button>
                </div>
                <form className="admin-form-grid" onSubmit={saveEditor}>
                  {collectionFields[section as ManagedCollection]
                    .filter(
                      (field) =>
                        !(
                          section === "services" &&
                          field.name === "background" &&
                          Number(editor.order) === 1
                        ),
                    )
                    .map((field) => {
                      const FieldWrapper =
                        field.type === "image" || field.type === "gallery"
                          ? "div"
                          : "label";
                      const galleryValue = editor[field.name];
                      return (
                        <FieldWrapper
                          className={`admin-field ${field.type === "textarea" || field.type === "gallery" ? "wide" : ""} ${field.type === "checkbox" ? "admin-checkbox-field" : ""}`}
                          key={field.name}
                        >
                          <span>{field.label}</span>
                          {field.type === "image" ? (
                            <CloudinaryImageField
                              aspectRatio={field.aspectRatio}
                              fieldName={field.name}
                              onChange={(url) =>
                                setEditor((current) =>
                                  current ? { ...current, [field.name]: url } : current,
                                )
                              }
                              required={!field.optional}
                              value={text(editor[field.name])}
                            />
                          ) : field.type === "gallery" ? (
                            <CloudinaryImageGalleryField
                              fieldName={field.name}
                              maxItems={field.maxItems}
                              onChange={(urls) =>
                                setEditor((current) =>
                                  current ? { ...current, [field.name]: urls } : current,
                                )
                              }
                              value={
                                Array.isArray(galleryValue)
                                  ? galleryValue.map(String)
                                  : text(galleryValue)
                                      .split(/[\n,]/)
                                      .map((url) => url.trim())
                                      .filter(Boolean)
                              }
                            />
                          ) : field.type === "checkbox" ? (
                            <input
                              checked={Boolean(editor[field.name])}
                              name={field.name}
                              onChange={(event) =>
                                setEditor((current) =>
                                  current
                                    ? { ...current, [field.name]: event.target.checked }
                                    : current,
                                )
                              }
                              type="checkbox"
                            />
                          ) : field.type === "select" ? (
                            <select
                              name={field.name}
                              value={text(editor[field.name] || field.options?.[0] || "")}
                              onChange={(event) =>
                                setEditor((current) =>
                                  current
                                    ? { ...current, [field.name]: event.target.value }
                                    : current,
                                )
                              }
                            >
                              {field.options?.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === "textarea" ? (
                            <textarea
                              aria-label={field.label}
                              name={field.name}
                              required={!field.optional}
                              value={text(editor[field.name])}
                              onChange={(event) =>
                                setEditor((current) =>
                                  current
                                    ? { ...current, [field.name]: event.target.value }
                                    : current,
                                )
                              }
                              rows={4}
                            />
                          ) : (
                            <input
                              name={field.name}
                              required={!field.optional}
                              type="text"
                              value={text(editor[field.name])}
                              onChange={(event) =>
                                setEditor((current) =>
                                  current
                                    ? { ...current, [field.name]: event.target.value }
                                    : current,
                                )
                              }
                            />
                          )}
                        </FieldWrapper>
                      );
                    })}
                  <label className="admin-field">
                    <span>Display order</span>
                    <input
                      type="number"
                      name="order"
                      min="0"
                      step="1"
                      required
                      value={text(editor.order ?? 0)}
                      onChange={(event) =>
                        setEditor((current) =>
                          current
                            ? { ...current, order: Number(event.target.value) }
                            : current,
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Visibility</span>
                    <select name="status" defaultValue={text(editor.status || "Draft")}>
                      <option>Draft</option>
                      <option>Published</option>
                    </select>
                  </label>
                  <div className="admin-form-actions wide">
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => setEditor(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="admin-button admin-button-primary"
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save item"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {section === "leads" && (
          <section className="admin-page-content">
            <div className="admin-panel">
              <div className="admin-panel-heading admin-list-heading">
                <div>
                  <h2>Enquiries</h2>
                  <p>Review, track, and follow up on incoming project leads.</p>
                </div>
                <button
                  className="admin-button"
                  disabled={records.length === 0}
                  onClick={() => {
                    try {
                      downloadCsv("kitari-leads.csv", records);
                      setNotice("Leads exported as CSV.");
                    } catch (reason) {
                      setError(formatError(reason));
                    }
                  }}
                >
                  Export CSV ↓
                </button>
              </div>
              <div className="admin-toolbar">
                <input
                  className="admin-search"
                  type="search"
                  placeholder="Search leads…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <span>{records.length} leads</span>
              </div>
              {loading ? (
                <Loading />
              ) : records.length === 0 ? (
                <Empty />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Project</th>
                        <th>Email</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <strong>{text(lead.name)}</strong>
                          </td>
                          <td>{text(lead.projectType)}</td>
                          <td>{text(lead.email)}</td>
                          <td>{text(lead.createdAt)}</td>
                          <td>
                            <select
                              aria-label={`Status for ${text(lead.name)}`}
                              value={text(lead.status)}
                              disabled={saving}
                              onChange={(event) =>
                                void changeLeadStatus(lead, event.target.value)
                              }
                            >
                              <option>New</option>
                              <option>Contacted</option>
                              <option>Won</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="admin-text-button"
                              onClick={() => setLeadDetails(lead)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {leadDetails && (
              <div className="admin-panel admin-detail-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>{text(leadDetails.name)}</h2>
                    <p>
                      {text(leadDetails.email)} · {text(leadDetails.projectType)}
                    </p>
                  </div>
                  <button
                    className="admin-text-button"
                    onClick={() => setLeadDetails(null)}
                  >
                    Close ×
                  </button>
                </div>
                <p className="admin-lead-message">{text(leadDetails.message)}</p>
              </div>
            )}
          </section>
        )}

        {section === "newsletter" && (
          <section className="admin-page-content">
            <div className="admin-panel">
              <div className="admin-panel-heading admin-list-heading">
                <div>
                  <h2>Newsletter subscribers</h2>
                  <p>Download the current subscriber list or remove a record.</p>
                </div>
                <button
                  className="admin-button"
                  disabled={!records.length}
                  onClick={() => {
                    try {
                      downloadCsv("kitari-newsletter-subscribers.csv", records);
                      setNotice("Subscribers exported as CSV.");
                    } catch (reason) {
                      setError(formatError(reason));
                    }
                  }}
                >
                  Export CSV ↓
                </button>
              </div>
              <div className="admin-toolbar">
                <input
                  className="admin-search"
                  type="search"
                  placeholder="Search subscribers…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <span>{records.length} subscribers</span>
              </div>
              {loading ? (
                <Loading />
              ) : records.length === 0 ? (
                <Empty />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((item) => (
                        <tr key={item.id}>
                          <td>{text(item.email)}</td>
                          <td>{text(item.createdAt)}</td>
                          <td>
                            <button
                              className="admin-text-button danger"
                              disabled={saving}
                              onClick={() => void handleDelete(item)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {(section === "settings" ||
          section === "about" ||
          section === "homepage" ||
          section === "appearance") && (
          <section className="admin-page-content">
            <div className="admin-panel admin-editor">
              <div className="admin-panel-heading">
                <div>
                  <h2>
                    {section === "about"
                      ? "About section content"
                      : section === "homepage"
                        ? "Homepage text"
                        : section === "appearance"
                          ? "Website appearance"
                          : "Website details"}
                  </h2>
                  <p>
                    {section === "about"
                      ? "Update the About text, center image, and surrounding statistics."
                      : section === "homepage"
                        ? "Edit homepage text and all ten moving hero card images. Content collections such as services, projects, testimonials, and FAQs are managed in their own sections."
                        : section === "appearance"
                          ? "Adjust the site-wide typeface and text scale. Preview the effect before saving."
                          : "Update your public contact details and core messaging."}
                  </p>
                </div>
              </div>
              {loading ? (
                <Loading />
              ) : (
                <form className="admin-form-grid" onSubmit={saveSiteSettings}>
                  {(section === "about"
                    ? aboutFields
                    : section === "homepage"
                      ? homepageFields
                      : section === "appearance"
                        ? appearanceFields
                        : settingFields
                  ).map((field, index) => (
                    <Fragment key={`homepage-group-${index}`}>
                      {section === "homepage" && homepageTextGroupHeadings[index] && (
                        <div className="admin-home-copy-group wide">
                          <h3>{homepageTextGroupHeadings[index]}</h3>
                        </div>
                      )}
                      <div
                        className={`admin-field ${field.type === "textarea" || field.type === "image" ? "wide" : ""}`}
                      >
                        <span>{field.label}</span>
                        {field.type === "image" ? (
                          <CloudinaryImageField
                            aspectRatio={field.aspectRatio}
                            fieldName={field.name}
                            onChange={(url) =>
                              setSettings((current) => ({
                                ...current,
                                [field.name]: url,
                              }))
                            }
                            value={settings[field.name] ?? ""}
                          />
                        ) : field.type === "textarea" ? (
                          <textarea
                            aria-label={field.label}
                            name={field.name}
                            required={"optional" in field ? !field.optional : true}
                            rows={4}
                            value={settings[field.name] ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                [field.name]: event.target.value,
                              }))
                            }
                          />
                        ) : field.type === "select" ? (
                          <select
                            aria-label={field.label}
                            name={field.name}
                            value={settings[field.name] ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                [field.name]: event.target.value,
                              }))
                            }
                          >
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            aria-label={field.label}
                            name={field.name}
                            type={field.type ?? "text"}
                            min={field.type === "number" ? field.minimum : undefined}
                            max={field.type === "number" ? field.maximum : undefined}
                            step={field.type === "number" ? field.step : undefined}
                            required={"optional" in field ? !field.optional : true}
                            value={settings[field.name] ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                [field.name]: event.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    </Fragment>
                  ))}
                  {section === "appearance" && (
                    <div className="admin-appearance-preview wide">
                      <span className="admin-eyebrow">Live preview</span>
                      <strong
                        style={{
                          fontFamily: appearanceFontFamily,
                          fontSize: `${26 * appearanceTextScale * appearanceHeadingScale}px`,
                        }}
                      >
                        Thoughtful digital experiences
                      </strong>
                      <p
                        style={{
                          fontFamily: appearanceFontFamily,
                          fontSize: `${14 * appearanceTextScale * appearanceBodyScale}px`,
                        }}
                      >
                        Your global typeface and scale will be applied across the public
                        website.
                      </p>
                      <nav
                        aria-label="Navigation preview"
                        className="admin-appearance-preview-nav"
                        style={{
                          fontFamily: appearanceFontFamily,
                          fontSize: `${13 * appearanceTextScale * appearanceNavScale}px`,
                        }}
                      >
                        Home <span>About</span> <span>Services</span>
                      </nav>
                      <button
                        className="admin-button admin-button-primary admin-appearance-preview-button"
                        style={{
                          fontFamily: appearanceFontFamily,
                          fontSize: `${13 * appearanceTextScale * appearanceButtonScale}px`,
                        }}
                        type="button"
                      >
                        Schedule a Call
                      </button>
                      <small>Text scale: {Math.round(appearanceTextScale * 100)}%</small>
                      <small>
                        Headings {Math.round(appearanceHeadingScale * 100)}% · Body{" "}
                        {Math.round(appearanceBodyScale * 100)}% · Navigation{" "}
                        {Math.round(appearanceNavScale * 100)}% · Actions{" "}
                        {Math.round(appearanceButtonScale * 100)}%
                      </small>
                    </div>
                  )}
                  <div className="admin-form-actions wide">
                    <button
                      className="admin-button admin-button-primary"
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="admin-kpi">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status.toLowerCase() === "published" || status.toLowerCase() === "won"
      ? "positive"
      : status.toLowerCase() === "draft" || status.toLowerCase() === "new"
        ? "pending"
        : "neutral";
  return <span className={`admin-status ${style}`}>{status}</span>;
}

function Loading() {
  return (
    <p className="admin-empty" role="status">
      Loading records…
    </p>
  );
}

function Empty() {
  return (
    <p className="admin-empty">
      Nothing here yet. Items will appear here when available.
    </p>
  );
}

function navIcon(section: Section) {
  const icons: Record<string, string> = {
    overview: "◫",
    analytics: "▥",
    homepage: "✎",
    about: "◉",
    projects: "▧",
    catalogue: "◈",
    services: "◇",
    testimonials: "❞",
    faqs: "?",
    leads: "↘",
    newsletter: "✉",
    settings: "⚙",
    appearance: "✧",
  };
  return icons[section] ?? "•";
}
