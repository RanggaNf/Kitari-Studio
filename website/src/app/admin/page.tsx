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
import { ProspectManager } from "@/components/admin/prospect-manager";
import { WorldMapHeatmap } from "@/components/admin/analytics-world-map";
import { fallbackContent } from "@/data/homepage-fallback";
import {
  collectionFields,
  deleteSubscriber,
  listContent,
  listLeads,
  listPublishedContentCounts,
  listSubscribers,
  loadSettings,
  loadAnalyticsData,
  type AnalyticsData,
  managedCollections,
  removeContent,
  saveContent,
  saveSettings,
  updateLeadStatus,
  type ManagedCollection,
  type ManagedRecord,
} from "@/lib/firebase/admin-data";
import { signOutAdmin, useAdminSession } from "@/lib/firebase/admin-session";
import {
  listBusinessProspects,
  type SavedBusinessProspect,
} from "@/lib/firebase/prospect-data";
import { Icon, StatusPill, type IconName } from "./admin-ui";
import {
  OverviewDashboard,
  emptyDashboard,
  type DashboardData,
  type DashboardTarget,
} from "./overview-dashboard";
import { useAdminTheme } from "./use-admin-theme";
import { SiteSettingsSchema } from "@/lib/data/schemas";
import { slugifyProjectTitle } from "@/lib/data/projects";

type Section =
  | "overview"
  | "analytics"
  | ManagedCollection
  | "leads"
  | "newsletter"
  | "prospects"
  | "about"
  | "homepage"
  | "appearance"
  | "settings";
type ContentStatusFilter = "all" | "published" | "draft";

type LeadStatusFilter = "all" | "New" | "Contacted" | "Won";
type SelectOptions = {
  leadFilter?: LeadStatusFilter;
  contentFilter?: ContentStatusFilter;
  search?: string;
  lead?: ManagedRecord;
  prospectId?: string;
};

const navItems: Array<{ id: Section; label: string; group: string; icon: IconName }> = [
  { id: "overview", label: "Overview", group: "Workspace", icon: "overview" },
  { id: "analytics", label: "Analytics", group: "Workspace", icon: "analytics" },
  { id: "leads", label: "Leads", group: "Inbox", icon: "leads" },
  { id: "newsletter", label: "Newsletter", group: "Inbox", icon: "newsletter" },
  { id: "projects", label: "Our work", group: "Content", icon: "work" },
  { id: "services", label: "Services", group: "Content", icon: "services" },
  { id: "catalogue", label: "Catalogue", group: "Content", icon: "catalogue" },
  { id: "testimonials", label: "Testimonials", group: "Content", icon: "testimonials" },
  { id: "faqs", label: "FAQs", group: "Content", icon: "faqs" },
  { id: "homepage", label: "Homepage", group: "Website", icon: "homepage" },
  { id: "about", label: "About", group: "Website", icon: "about" },
  { id: "settings", label: "Studio & contact", group: "Website", icon: "studio" },
  { id: "appearance", label: "Appearance", group: "Website", icon: "appearance" },
  { id: "prospects", label: "Prospects", group: "Prospects", icon: "prospects" },
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
  27: "Footer",
  56: "Moving hero cards",
};
const websiteSettingGroupHeadings: Record<number, string> = {
  0: "Studio identity",
  2: "Contact details",
  6: "Social channels",
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
  const valueText = text(value);
  const safeText = /^[\s\uFEFF]*[=+\-@]/u.test(valueText) ? `'${valueText}` : valueText;
  return `"${safeText.replaceAll('"', '""')}"`;
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

function buildDashboard(
  leads: ManagedRecord[],
  prospects: SavedBusinessProspect[],
): DashboardData {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      start: start.getTime(),
      end: end.getTime(),
      label: start.toLocaleDateString("id-ID", { month: "short" }),
    };
  });
  const enquiries = buckets.map(() => 0);
  const followUps = buckets.map(() => 0);
  for (const lead of leads) {
    const time = timeValue(lead.createdAt);
    const index = buckets.findIndex(
      (bucket) => time >= bucket.start && time < bucket.end,
    );
    if (index < 0) continue;
    enquiries[index] += 1;
    // A lead counts as followed up once it is Contacted or Won.
    if (lead.status === "Contacted" || lead.status === "Won") followUps[index] += 1;
  }
  const open = prospects.filter((prospect) => !prospect.contacted);
  return {
    months: buckets.map((bucket) => bucket.label),
    enquiries,
    followUps,
    uncontacted: open.slice(0, 2).map((prospect) => ({
      id: prospect.id,
      name: prospect.name,
      city: prospect.city,
      country: prospect.country,
      locationId: prospect.locationId,
      contacted: prospect.contacted,
      channel: prospect.email ? "Email" : prospect.phone ? "WhatsApp" : "Manual",
    })),
    uncontactedTotal: open.length,
    recentLeads: [...leads]
      .sort((first, second) => timeValue(second.createdAt) - timeValue(first.createdAt))
      .slice(0, 3),
  };
}

function sectionLead(section: Section) {
  if (section === "overview") return "Kelola dan pantau studio Anda";
  if (section === "analytics") return "Status koneksi GA4 dan performa halaman.";
  if (section === "leads") return "Balas enquiry dan perbarui statusnya.";
  if (section === "newsletter") return "Subscriber dari form publik.";
  if (section === "prospects")
    return "Pilih kota untuk melanjutkan follow-up atau mengimpor bisnis baru.";
  if (
    section === "homepage" ||
    section === "about" ||
    section === "settings" ||
    section === "appearance"
  )
    return "Perubahan di sini langsung tampil di website publik setelah dipublikasikan.";
  return "Item Published tampil di website. Draft hanya terlihat admin.";
}

export default function AdminPage() {
  const router = useRouter();
  const session = useAdminSession();
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [settingsSnapshot, setSettingsSnapshot] = useState("");
  const [settingsReviewOpen, setSettingsReviewOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Record<
    string,
    string | number
  > | null>(null);
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
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<ManagedRecord | null>(null);
  const [editorSnapshot, setEditorSnapshot] = useState("");
  const [leadDetails, setLeadDetails] = useState<ManagedRecord | null>(null);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const { theme, toggleTheme } = useAdminTheme();
  const [taskFilter, setTaskFilter] = useState<"all" | "action">("all");
  const [tasksOpen, setTasksOpen] = useState(true);
  const [chartIndex, setChartIndex] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [overviewError, setOverviewError] = useState("");
  const [overviewLoaded, setOverviewLoaded] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!session.loading && (!session.user || !session.isAdmin)) {
      router.replace("/admin/login");
    }
  }, [router, session.isAdmin, session.loading, session.user]);

  const loadSection = useCallback(async () => {
    if (!session.isAdmin) return;
    setLoading(true);
    setError("");
    if (section === "overview") setOverviewError("");
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
        const nextSettings = Object.fromEntries(
          fields.map(({ name }) => [
            name,
            text(
              value[name] ??
                fallbackContent.settings[name as keyof typeof fallbackContent.settings],
            ),
          ]),
        );
        setSettings(nextSettings);
        setSettingsSnapshot(JSON.stringify(nextSettings));
      } else if (section === "overview") {
        const [nextCounts, leads, subscribers, prospects] = await Promise.all([
          listPublishedContentCounts(),
          listLeads(),
          listSubscribers(),
          listBusinessProspects(),
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
        setDashboard(buildDashboard(leads, prospects));
        setOverviewLoaded(true);
        setRecords([]);
      } else if (section === "analytics") {
        const data = await loadAnalyticsData();
        setAnalyticsData(data);
      }
    } catch (reason) {
      if (section === "overview") setOverviewError(formatError(reason));
      setError(formatError(reason));
    } finally {
      setLoading(false);
    }
  }, [search, section, session.isAdmin]);

  useEffect(() => {
    void Promise.resolve().then(loadSection);
  }, [loadSection]);

  const hasUnsavedSettings =
    settingsSnapshot !== "" && settingsSnapshot !== JSON.stringify(settings);

  useEffect(() => {
    if (!hasUnsavedSettings) return;
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedSettings]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const title = useMemo(
    () => navItems.find((item) => item.id === section)?.label ?? "Admin",
    [section],
  );
  const currentGroup = navItems.find((item) => item.id === section)?.group ?? "Workspace";

  function selectSection(next: Section, options: SelectOptions = {}) {
    if (
      editor &&
      editorSnapshot !== JSON.stringify(editor) &&
      !window.confirm("Discard your unsaved changes and leave this editor?")
    ) {
      return;
    }
    if (
      hasUnsavedSettings &&
      !window.confirm("Discard website changes that have not been published?")
    ) {
      return;
    }
    setSection(next);
    setMenuOpen(false);
    setSearch(options.search ?? "");
    setContentStatusFilter(options.contentFilter ?? "all");
    setLeadStatusFilter(options.leadFilter ?? "all");
    setEditor(null);
    setEditorSnapshot("");
    setLeadDetails(options.lead ?? null);
    setSelectedProspectId(options.prospectId ?? "");
    setSettings({});
    setSettingsSnapshot("");
    setSettingsReviewOpen(false);
    setNotice("");
    setError("");
  }

  function startEditor(record: ManagedRecord) {
    setEditor(record);
    setEditorSnapshot(JSON.stringify(record));
    setError("");
    setNotice("");
  }

  function closeEditor() {
    if (
      editor &&
      editorSnapshot !== JSON.stringify(editor) &&
      !window.confirm("Discard your unsaved changes?")
    ) {
      return;
    }
    setEditor(null);
    setEditorSnapshot("");
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
    return (
      <main className="admin-loading" data-theme={theme}>
        Verifying administrator access…
      </main>
    );
  }
  if (session.error) {
    return (
      <main className="admin-loading" data-theme={theme}>
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
  const activeSettingsFields =
    section === "about"
      ? aboutFields
      : section === "homepage"
        ? homepageFields
        : section === "appearance"
          ? appearanceFields
          : settingFields;
  const savedSettings = settingsSnapshot
    ? (JSON.parse(settingsSnapshot) as Record<string, string>)
    : {};
  const settingsChanges = activeSettingsFields.flatMap((field) => {
    const previous = savedSettings[field.name] ?? "";
    const current = settings[field.name] ?? "";
    return previous === current ? [] : [{ field, previous, current }];
  });

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
      setEditorSnapshot("");
      setNotice("Content saved successfully.");
      await loadSection();
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  function reviewSiteSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = Object.fromEntries(
      activeSettingsFields.map(({ name, type }) => {
        const raw = String(formData.get(name) ?? "").trim();
        return [name, type === "number" ? Number(raw) : raw];
      }),
    );
    const parsed = SiteSettingsSchema.safeParse({
      ...fallbackContent.settings,
      ...settings,
      ...value,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the settings and try again.");
      return;
    }
    setPendingSettings(value);
    setSettingsReviewOpen(true);
    setError("");
  }

  async function publishSiteSettings() {
    if (!pendingSettings) return;
    setSaving(true);
    setError("");
    try {
      const currentValue = await loadSettings();
      const parsed = SiteSettingsSchema.safeParse({
        ...fallbackContent.settings,
        ...currentValue,
        ...pendingSettings,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Check the settings and try again.");
        return;
      }
      await saveSettings(parsed.data);
      const publishedValues = Object.fromEntries(
        activeSettingsFields.map(({ name }) => [name, text(pendingSettings[name])]),
      );
      const nextSettings = {
        ...settings,
        ...publishedValues,
      };
      setSettings(nextSettings);
      setSettingsSnapshot(JSON.stringify(nextSettings));
      setSettingsReviewOpen(false);
      setPendingSettings(null);
      setNotice(
        section === "about"
          ? "About section published successfully."
          : section === "homepage"
            ? "Homepage changes published successfully."
            : section === "appearance"
              ? "Appearance changes published successfully."
              : "Studio and contact changes published successfully.",
      );
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setSaving(false);
    }
  }

  function resetSiteSettings() {
    setSettings(savedSettings);
    setError("");
    setNotice("");
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
  const draftCount = Object.values(counts).reduce(
    (total, count) => total + count.total - count.published,
    0,
  );
  const activeSettingsSection =
    section === "settings" ||
    section === "about" ||
    section === "homepage" ||
    section === "appearance";
  const visibleLeads =
    section === "leads" && leadStatusFilter !== "all"
      ? records.filter((lead) => lead.status === leadStatusFilter)
      : records;
  const leadStatusCounts = {
    all: records.length,
    New: records.filter((lead) => lead.status === "New").length,
    Contacted: records.filter((lead) => lead.status === "Contacted").length,
    Won: records.filter((lead) => lead.status === "Won").length,
  };

  const headingTitle = section === "overview" ? "Admin Dashboard" : title;

  function openDashboardTarget(target: DashboardTarget) {
    if (target.contentFilter === "draft" && target.section === "projects") {
      selectSection("projects", { contentFilter: "draft" });
      return;
    }
    selectSection(target.section, {
      leadFilter: target.leadFilter,
      contentFilter: target.contentFilter,
      lead: target.lead,
      prospectId: target.prospectId,
    });
  }

  function searchLeadsFromHeading() {
    selectSection("leads", { search: globalSearch.trim() });
    setGlobalSearch("");
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  // Pending-work counters shown next to sidebar items.
  const itemBadges: Partial<Record<Section, number>> = {
    leads: overviewStats.newLeads,
    prospects: dashboard.uncontactedTotal,
  };
  for (const collection of Object.keys(counts) as ManagedCollection[]) {
    itemBadges[collection] = counts[collection].total - counts[collection].published;
  }

  return (
    <div
      className="admin-shell"
      data-menu-open={menuOpen}
      data-theme={theme}
    >
      <a className="admin-skip-link" href="#admin-main">
        Skip to main content
      </a>
      <aside aria-label="Admin navigation" className="admin-sidebar" id="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link href="/" className="admin-brand" aria-label="Kitari Studio — open website">
            <span aria-hidden="true" className="admin-brand-mark">
              K
            </span>
            <span className="admin-brand-text">Kitari Studio</span>
          </Link>
          <button
            aria-label="Close menu"
            className="admin-icon-button admin-sidebar-close"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav aria-label="Admin pages" className="admin-sidebar-nav">
          {groupNames.map((group) => (
            <div className="admin-nav-group" key={group}>
              <p className="admin-nav-label">{group}</p>
              <ul aria-label={group} className="admin-nav-list">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const badge = itemBadges[item.id] ?? 0;
                    return (
                      <li key={item.id}>
                        <button
                          aria-current={section === item.id ? "page" : undefined}
                          className="admin-nav-item"
                          onClick={() => selectSection(item.id)}
                          title={item.label}
                          type="button"
                        >
                          <Icon name={item.icon} size={19} />
                          <span className="admin-nav-text">{item.label}</span>
                          {badge > 0 ? (
                            <span aria-label={`${badge} pending`} className="admin-nav-badge">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">
              KS
            </span>
            <span className="admin-user-meta">
              <strong>Kitari Studio</strong>
              <small>{session.user?.email}</small>
            </span>
          </div>
          <button
            aria-label="Sign out"
            className="admin-icon-button"
            onClick={handleLogout}
            title="Sign out"
            type="button"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      <div
        aria-hidden="true"
        className="admin-sidebar-scrim"
        onClick={() => setMenuOpen(false)}
      />

      <div className="admin-app">
        <header className="admin-topbar">
          <button
            aria-controls="admin-sidebar"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="admin-icon-button admin-menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Icon name="menu" size={20} />
          </button>
          <nav aria-label="Breadcrumb" className="admin-breadcrumb">
            <span>{currentGroup}</span>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">{title}</strong>
          </nav>
          <div className="admin-topbar-actions">
            <button
              aria-label={`Open new leads${overviewStats.newLeads ? ` (${overviewStats.newLeads})` : ""}`}
              className="admin-icon-button"
              onClick={() => selectSection("leads", { leadFilter: "New" })}
              title="New leads"
              type="button"
            >
              <Icon name="leads" size={20} />
              {overviewStats.newLeads > 0 ? <i className="admin-notification-dot" /> : null}
            </button>
            <button
              aria-label={`Open drafts${draftCount ? ` (${draftCount})` : ""}`}
              className="admin-icon-button"
              onClick={() => selectSection("projects", { contentFilter: "draft" })}
              title="Drafts"
              type="button"
            >
              <Icon name="bell" size={20} />
              {draftCount > 0 ? <i className="admin-notification-dot" /> : null}
            </button>
            <a
              aria-label="View website (opens in a new tab)"
              className="admin-icon-button"
              href="/"
              rel="noreferrer"
              target="_blank"
              title="View website"
            >
              <Icon name="globe" size={20} />
            </a>
            <button
              aria-label={`Switch to ${nextTheme} mode`}
              className="admin-icon-button"
              onClick={toggleTheme}
              title={`${nextTheme === "dark" ? "Dark" : "Light"} mode`}
              type="button"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
            </button>
          </div>
        </header>

        <main className="admin-main" id="admin-main" tabIndex={-1}>
          <div className="admin-heading">
            <div className="admin-heading-copy">
              <h1>{headingTitle}</h1>
              <p className="admin-lead">{sectionLead(section)}</p>
            </div>
            {section === "overview" && (
              <div className="admin-heading-actions">
                <label className="admin-global-search">
                  <Icon name="search" size={26} />
                  <input
                    aria-label="Cari lead"
                    onChange={(event) => setGlobalSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        searchLeadsFromHeading();
                      }
                    }}
                    placeholder="Cari lead, lalu tekan Enter"
                    value={globalSearch}
                  />
                </label>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="admin-alert admin-alert-error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="admin-toast">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} type="button">
                Tutup
              </button>
            </div>
          )}

          {section === "overview" && (
            <OverviewDashboard
              chartIndex={chartIndex}
              counts={counts}
              data={dashboard}
              loading={loading || !overviewLoaded}
              failed={Boolean(overviewError)}
              onRetry={() => void loadSection()}
              onChartIndex={setChartIndex}
              onNavigate={openDashboardTarget}
              onTaskFilter={setTaskFilter}
              onToggleTasks={() => setTasksOpen((open) => !open)}
              pipeline={leadPipeline}
              stats={overviewStats}
              taskFilter={taskFilter}
              tasksOpen={tasksOpen}
            />
          )}

          {section === "analytics" && (
            <section className="admin-page-content admin-analytics-page" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="admin-analytics-intro">
                <div>
                  <p className="admin-subtitle">
                    Pantau kinerja pengunjung global, sumber saluran traffic, dan halaman terpopuler secara real-time.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "99px" }}
                    onClick={() => void loadSection()}
                  >
                    🔄 Refresh Data
                  </button>
                  <span className="admin-analytics-period">28 hari terakhir</span>
                </div>
              </div>

              {/* Status Koneksi */}
              <div className="admin-analytics-connection" role="status">
                <span
                  aria-hidden="true"
                  style={
                    analyticsData?.connected
                      ? { background: "#10b981", color: "#fff" }
                      : undefined
                  }
                >
                  {analyticsData?.connected ? "✓" : "i"}
                </span>
                <div>
                  <strong>
                    {analyticsData?.connected
                      ? "Google Analytics 4 Terhubung & Sinkron"
                      : "Membutuhkan Koneksi GA4"}
                  </strong>
                  <p>
                    {analyticsData?.connected
                      ? `Terkoneksi ke properti ID ${analyticsData.propertyId ?? "559450385"}. Terakhir diperbarui: ${analyticsData.updatedAt ? new Date(analyticsData.updatedAt).toLocaleString("id-ID") : "Baru saja"}.`
                      : "Tag pelacak GA4 aktif di website publik. Data analitik ditarik melalui Google Analytics Data API."}
                  </p>
                </div>
                <span
                  className="admin-analytics-status"
                  style={
                    analyticsData?.connected
                      ? {
                          borderColor: "rgba(16, 185, 129, 0.4)",
                          color: "#10b981",
                        }
                      : undefined
                  }
                >
                  {analyticsData?.connected ? "Live Sync Active" : "Setup required"}
                </span>
              </div>

              {/* 4 Kartu KPI Utama */}
              <div className="admin-analytics-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {[
                  [
                    "Pengguna Aktif",
                    analyticsData?.activeVisitors !== undefined
                      ? String(analyticsData.activeVisitors)
                      : "—",
                    "Pengunjung unik (28 hari)",
                  ],
                  [
                    "Tampilan Halaman",
                    analyticsData?.pageViews !== undefined
                      ? String(analyticsData.pageViews)
                      : "—",
                    "Total tayangan seluruh halaman",
                  ],
                  [
                    "Total Sesi",
                    analyticsData?.sessions !== undefined
                      ? String(analyticsData.sessions)
                      : "—",
                    "Kunjungan sesi website",
                  ],
                  [
                    "Rata-rata Interaksi",
                    analyticsData?.avgEngagement ?? "—",
                    "Waktu aktif per pengguna",
                  ],
                ].map(([label, value, note]) => (
                  <article className="admin-kpi" key={label}>
                    <p>{label}</p>
                    <strong aria-label={`${label}: ${value}`}>{value}</strong>
                    <small>{note}</small>
                  </article>
                ))}
              </div>

              {/* 🌍 Peta Dunia Heatmap ala Google Analytics */}
              <WorldMapHeatmap countries={analyticsData?.countries || []} />

              {/* 2 Kolom: Saluran Akuisisi & Perangkat */}
              <div className="admin-analytics-grid-2">
                {/* Saluran Akuisisi Traffic */}
                <div className="admin-sub-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3>Sesi menurut Grup Saluran Utama</h3>
                      <p style={{ color: "var(--mu)", fontSize: "13px", margin: "4px 0 0" }}>
                        Sumber trafik pengunjung (Direct, Search, Referral, Social)
                      </p>
                    </div>
                  </div>

                  <div className="admin-channel-list">
                    {(analyticsData?.channels && analyticsData.channels.length > 0
                      ? analyticsData.channels
                      : [
                          { channel: "Direct", sessions: 159, users: 100 },
                          { channel: "Organic Search", sessions: 32, users: 4 },
                          { channel: "Referral", sessions: 22, users: 3 },
                          { channel: "Organic Social", sessions: 1, users: 1 },
                        ]
                    ).map((ch) => {
                      const totalSess =
                        analyticsData?.channels?.reduce((acc, c) => acc + c.sessions, 0) || 214;
                      const pct = totalSess > 0 ? Math.round((ch.sessions / totalSess) * 100) : 0;
                      return (
                        <div key={ch.channel} className="admin-channel-row">
                          <div className="admin-channel-info">
                            <span style={{ fontWeight: 500 }}>{ch.channel}</span>
                            <span>
                              <strong>{ch.sessions}</strong> sesi ({pct}%)
                            </span>
                          </div>
                          <div className="admin-channel-track">
                            <div
                              className="admin-channel-fill"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Kategori Perangkat (Desktop, Mobile, Tablet) */}
                <div className="admin-sub-card">
                  <div>
                    <h3>Pengguna menurut Kategori Perangkat</h3>
                    <p style={{ color: "var(--mu)", fontSize: "13px", margin: "4px 0 0" }}>
                      Distribusi perangkat yang digunakan pengunjung
                    </p>
                  </div>

                  <div className="admin-device-grid">
                    {(analyticsData?.devices && analyticsData.devices.length > 0
                      ? analyticsData.devices
                      : [
                          { category: "desktop", users: 72 },
                          { category: "mobile", users: 31 },
                          { category: "tablet", users: 1 },
                        ]
                    ).map((d) => {
                      const totalDevUsers =
                        analyticsData?.devices?.reduce((acc, cur) => acc + cur.users, 0) || 104;
                      const pct = totalDevUsers > 0 ? Math.round((d.users / totalDevUsers) * 100) : 0;
                      const icon =
                        d.category === "mobile"
                          ? "📱"
                          : d.category === "tablet"
                            ? "📟"
                            : "💻";
                      const label =
                        d.category === "mobile"
                          ? "Mobile"
                          : d.category === "tablet"
                            ? "Tablet"
                            : "Desktop";

                      return (
                        <div key={d.category} className="admin-device-item">
                          <span style={{ fontSize: "22px" }}>{icon}</span>
                          <strong>{d.users}</strong>
                          <span style={{ fontWeight: 600, color: "var(--tx)" }}>{label}</span>
                          <span>{pct}% share</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tabel Popularitas Halaman (Page Popularity Heatmap) */}
              <div className="admin-panel admin-page-heatmap">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Tampilan menurut Judul & Jalur Halaman</h2>
                    <p>
                      Bandingkan jumlah pengunjung, tayangan halaman, dan rata-rata durasi membaca.
                    </p>
                  </div>
                  <div
                    aria-label="Page view intensity: low to high"
                    className="admin-heatmap-legend"
                  >
                    <span>Rendah</span>
                    <i />
                    <span>Tinggi</span>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Halaman & Judul</th>
                        <th>Pengunjung</th>
                        <th>Tampilan</th>
                        <th>Rata-rata Interaksi</th>
                      </tr>
                    </thead>
                    {analyticsData?.pages && analyticsData.pages.length > 0 && (
                      <tbody>
                        {analyticsData.pages.map((p) => {
                          const maxViews = Math.max(
                            ...analyticsData.pages!.map((x) => x.pageViews),
                            1,
                          );
                          const ratio = Math.min(1, p.pageViews / maxViews);
                          return (
                            <tr key={p.path}>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <strong style={{ fontSize: "14px" }}>
                                    {p.title && p.title !== p.path ? p.title : p.path === "/" ? "Kitari Studio | Beranda" : p.path}
                                  </strong>
                                  <code style={{ fontSize: "12px", color: "var(--mu)" }}>{p.path}</code>
                                </div>
                              </td>
                              <td>{p.visitors}</td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                  }}
                                >
                                  <strong>{p.pageViews}</strong>
                                  <div
                                    style={{
                                      width: `${Math.max(14, Math.round(ratio * 72))}px`,
                                      height: "6px",
                                      borderRadius: "99px",
                                      background:
                                        "linear-gradient(90deg, #2a8bf2, #47c1ff)",
                                    }}
                                  />
                                </div>
                              </td>
                              <td>{p.avgEngagement}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </table>
                  {(!analyticsData?.pages || analyticsData.pages.length === 0) && (
                    <p className="admin-analytics-empty">
                      Data heatmap halaman akan muncul saat laporan GA4 berhasil ditarik.
                    </p>
                  )}
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
                        startEditor(
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
                                    onClick={() => startEditor(row)}
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
                      <p>
                        Complete the content details, then choose whether to save as a
                        draft or publish it.
                      </p>
                    </div>
                    <button className="admin-button" onClick={closeEditor} type="button">
                      ← Back to {title.toLowerCase()}
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
                                    current
                                      ? { ...current, [field.name]: urls }
                                      : current,
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
                                value={text(
                                  editor[field.name] || field.options?.[0] || "",
                                )}
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
                                type={field.type ?? "text"}
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
                      <select
                        name="status"
                        onChange={(event) =>
                          setEditor((current) =>
                            current
                              ? { ...current, status: event.target.value }
                              : current,
                          )
                        }
                        value={text(editor.status || "Draft")}
                      >
                        <option>Draft</option>
                        <option>Published</option>
                      </select>
                    </label>
                    <div className="admin-form-actions wide">
                      <button
                        type="button"
                        className="admin-button"
                        onClick={closeEditor}
                      >
                        Discard changes
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
            <section className="admin-page-content admin-leads-page">
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
                  <div className="admin-list-controls">
                    <input
                      className="admin-search"
                      type="search"
                      placeholder="Search by name, email, or project…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <div
                      aria-label="Filter enquiries by status"
                      className="admin-filter-tabs"
                      role="group"
                    >
                      {(
                        [
                          ["all", "All", leadStatusCounts.all],
                          ["New", "New", leadStatusCounts.New],
                          ["Contacted", "Contacted", leadStatusCounts.Contacted],
                          ["Won", "Won", leadStatusCounts.Won],
                        ] as const
                      ).map(([filter, label, count]) => (
                        <button
                          aria-pressed={leadStatusFilter === filter}
                          className={leadStatusFilter === filter ? "active" : ""}
                          key={filter}
                          onClick={() => setLeadStatusFilter(filter)}
                          type="button"
                        >
                          {label} {count}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span>{visibleLeads.length} shown</span>
                </div>
                {loading ? (
                  <Loading />
                ) : visibleLeads.length === 0 ? (
                  records.length === 0 ? (
                    <Empty />
                  ) : (
                    <p className="admin-empty">
                      No {leadStatusFilter.toLowerCase()} enquiries. Choose another status
                      or clear the search.
                    </p>
                  )
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
                        {visibleLeads.map((lead) => (
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
                <aside
                  className="admin-panel admin-detail-panel"
                  aria-label="Enquiry details"
                >
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
                </aside>
              )}
            </section>
          )}

          {section === "prospects" && (
            <ProspectManager
              adminEmail={session.user?.email ?? ""}
              initialProspect={dashboard.uncontacted.find(
                (prospect) => prospect.id === selectedProspectId,
              )}
              initialProspectId={selectedProspectId}
            />
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

          {activeSettingsSection && (
            <section className="admin-page-content">
              <div className="admin-panel admin-editor">
                <div className="admin-panel-heading">
                  <div>
                    <h2>
                      {section === "about"
                        ? "About section content"
                        : section === "homepage"
                          ? "Homepage content"
                          : section === "appearance"
                            ? "Website appearance"
                            : "Studio identity and contact"}
                    </h2>
                    <p>
                      {section === "about"
                        ? "Update the About text, center image, and surrounding statistics."
                        : section === "homepage"
                          ? "Edit homepage copy and all ten hero card images. Published collections are managed in Content."
                          : section === "appearance"
                            ? "Adjust the site-wide typeface and text scale. Preview the effect before saving."
                            : "Update your studio identity, contact details, and social links."}
                    </p>
                  </div>
                </div>
                {loading ? (
                  <Loading />
                ) : (
                  <form className="admin-form-grid" onSubmit={reviewSiteSettings}>
                    {section === "homepage" && (
                      <nav
                        aria-label="Homepage section index"
                        className="admin-homepage-section-nav wide"
                      >
                        {Object.entries(homepageTextGroupHeadings).map(
                          ([index, label]) => (
                            <a href={`#homepage-section-${index}`} key={index}>
                              {label}
                            </a>
                          ),
                        )}
                      </nav>
                    )}
                    {(section === "about"
                      ? aboutFields
                      : section === "homepage"
                        ? homepageFields
                        : section === "appearance"
                          ? appearanceFields
                          : settingFields
                    ).map((field, index) => (
                      <Fragment key={`homepage-group-${index}`}>
                        {(section === "homepage" && homepageTextGroupHeadings[index]) ||
                        (section === "about" && (index === 0 || index === 3)) ||
                        (section === "settings" && websiteSettingGroupHeadings[index]) ? (
                          <div className="admin-home-copy-group wide">
                            <h3
                              id={
                                section === "homepage"
                                  ? `homepage-section-${index}`
                                  : undefined
                              }
                            >
                              {section === "homepage"
                                ? homepageTextGroupHeadings[index]
                                : section === "about"
                                  ? index === 0
                                    ? "Studio overview"
                                    : "Studio statistics"
                                  : websiteSettingGroupHeadings[index]}
                            </h3>
                          </div>
                        ) : null}
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
                        <small>
                          Text scale: {Math.round(appearanceTextScale * 100)}%
                        </small>
                        <small>
                          Headings {Math.round(appearanceHeadingScale * 100)}% · Body{" "}
                          {Math.round(appearanceBodyScale * 100)}% · Navigation{" "}
                          {Math.round(appearanceNavScale * 100)}% · Actions{" "}
                          {Math.round(appearanceButtonScale * 100)}%
                        </small>
                      </div>
                    )}
                    <div className="admin-settings-publish-bar wide">
                      <p aria-live="polite">
                        {settingsChanges.length} unpublished{" "}
                        {settingsChanges.length === 1 ? "change" : "changes"}
                      </p>
                      <button
                        className="admin-button"
                        disabled={saving || settingsChanges.length === 0}
                        onClick={resetSiteSettings}
                        type="button"
                      >
                        Reset
                      </button>
                      <button
                        className="admin-button admin-button-primary"
                        disabled={saving || settingsChanges.length === 0}
                      >
                        Review & publish
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}
          {settingsReviewOpen && pendingSettings && (
            <div
              aria-labelledby="admin-settings-review-title"
              aria-modal="true"
              className="admin-review-overlay"
              role="dialog"
            >
              <section className="admin-review-dialog">
                <p className="admin-eyebrow">PUBLIC WEBSITE</p>
                <h2 id="admin-settings-review-title">Review changes before publishing</h2>
                <p>
                  These changes will appear on the public website as soon as they are
                  published.
                </p>
                <div className="admin-review-changes">
                  {settingsChanges.map(({ field, previous, current }) => (
                    <article key={field.name}>
                      <strong>{field.label}</strong>
                      <dl>
                        <div>
                          <dt>Before</dt>
                          <dd>{previous || "Empty"}</dd>
                        </div>
                        <div>
                          <dt>After</dt>
                          <dd>{current || "Empty"}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="admin-review-actions">
                  <button
                    className="admin-button"
                    disabled={saving}
                    onClick={() => {
                      setSettingsReviewOpen(false);
                      setPendingSettings(null);
                    }}
                    type="button"
                  >
                    Back to editing
                  </button>
                  <button
                    className="admin-button admin-button-primary"
                    disabled={saving}
                    onClick={() => void publishSiteSettings()}
                    type="button"
                  >
                    {saving ? "Publishing…" : "Publish to website"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
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
