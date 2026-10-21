import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { z, type ZodType } from "zod";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  LeadInputSchema,
  NewsletterInputSchema,
  SiteSettingsSchema,
  type LeadInput,
  type NewsletterInput,
  type SiteSettings,
} from "./schemas";

const publicCollections = [
  "catalogue",
  "services",
  "projects",
  "testimonials",
  "faqs",
] as const;

export type PublicCollection = (typeof publicCollections)[number];

const isPublicCollection = (value: string): value is PublicCollection =>
  publicCollections.some((collectionName) => collectionName === value);

const emailHash = async (email: string) => {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const applySubmissionCooldown = (key: string) => {
  try {
    const lastSubmission = Number(window.localStorage.getItem(key) ?? 0);
    const remaining = 60_000 - (Date.now() - lastSubmission);
    if (lastSubmission > 0 && remaining > 0) {
      throw new Error(
        `Please wait ${Math.ceil(remaining / 1000)} seconds before trying again.`,
      );
    }
    window.localStorage.setItem(key, String(Date.now()));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Please wait ")) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "SecurityError") {
      return;
    }
    throw new Error("Could not apply the submission cooldown.", { cause: error });
  }
};

export async function submitLead(input: LeadInput) {
  const parsed = LeadInputSchema.parse(input);
  if (parsed.website) return { status: "ignored" as const };

  applySubmissionCooldown("kitari:last-lead");
  const lead = {
    name: parsed.name,
    email: parsed.email,
    projectType: parsed.projectType,
    message: parsed.message,
  };
  const db = getFirebaseDb();
  await addDoc(collection(db, "leads"), {
    ...lead,
    status: "New",
    createdAt: serverTimestamp(),
  });
  return { status: "submitted" as const };
}

export async function subscribeToNewsletter(input: NewsletterInput) {
  const parsed = NewsletterInputSchema.parse(input);
  if (parsed.website) return { status: "ignored" as const };

  applySubmissionCooldown("kitari:last-newsletter");
  const subscriberId = await emailHash(parsed.email);
  const db = getFirebaseDb();
  await setDoc(doc(db, "newsletter", subscriberId), {
    email: parsed.email,
    createdAt: serverTimestamp(),
  });
  return { status: "submitted" as const };
}

export async function getPublishedCollection<T extends DocumentData>(
  collectionName: PublicCollection,
  schema: ZodType<T>,
): Promise<T[]> {
  if (!isPublicCollection(collectionName)) {
    throw new Error(`Unsupported public content collection: ${collectionName}`);
  }

  const db = getFirebaseDb();
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where("status", "==", "Published"),
      orderBy("order", "asc"),
    ),
  );
  return snapshot.docs.map((document) => {
    const result = schema.safeParse(document.data());
    if (!result.success) {
      throw new Error(
        `Invalid ${collectionName} document "${document.id}": ${z.prettifyError(result.error)}`,
      );
    }
    return result.data;
  });
}

export async function getPublicSiteSettings(): Promise<SiteSettings | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, "siteSettings", "main"));
  if (!snapshot.exists()) return null;

  const result = SiteSettingsSchema.safeParse(snapshot.data());
  if (!result.success) {
    throw new Error(`Invalid public site settings: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
