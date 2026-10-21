import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./client";

export const managedCollections = [
  "projects",
  "catalogue",
  "services",
  "testimonials",
  "faqs",
] as const;
export type ManagedCollection = (typeof managedCollections)[number];
export type ManagedRecord = Record<string, unknown> & { id: string };

export const collectionLabels: Record<ManagedCollection, string> = {
  projects: "Our Work",
  catalogue: "Catalogue",
  services: "Services",
  testimonials: "Testimonials",
  faqs: "FAQs",
};

export const collectionFields: Record<
  ManagedCollection,
  Array<{
    name: string;
    label: string;
    type?: "textarea" | "image" | "tags" | "gallery" | "checkbox" | "select";
    optional?: boolean;
    maxItems?: number;
    aspectRatio?: number;
    options?: string[];
  }>
> = {
  projects: [
    { name: "title", label: "Project name" },
    { name: "slug", label: "Project URL slug", optional: true },
    { name: "country", label: "Country" },
    { name: "year", label: "Year" },
    { name: "client", label: "Client", optional: true },
    {
      name: "clientComment",
      label: "Client comment / testimonial",
      type: "textarea",
      optional: true,
    },
    { name: "desc", label: "Description", type: "textarea" },
    { name: "overview", label: "Project overview", type: "textarea", optional: true },
    { name: "challenge", label: "Challenge", type: "textarea", optional: true },
    { name: "solution", label: "Solution", type: "textarea", optional: true },
    { name: "outcome", label: "Results / outcome", type: "textarea", optional: true },
    { name: "img", label: "Main cover image", type: "image" },
    { name: "imageAlt", label: "Image description" },
    { name: "tagsList", label: "Project tags (comma-separated)", type: "tags" },
    {
      name: "gallery",
      label: "Detail images (up to 3)",
      type: "gallery",
      optional: true,
      maxItems: 3,
    },
    { name: "websiteUrl", label: "Live project URL", optional: true },
    { name: "featured", label: "Feature on homepage", type: "checkbox" },
    {
      name: "stage",
      label: "Project stage",
      type: "select",
      options: ["Completed", "Coming soon"],
    },
  ],
  catalogue: [
    { name: "name", label: "Package name" },
    { name: "price", label: "Starting price" },
    { name: "img", label: "Preview image (square)", type: "image", aspectRatio: 1 },
  ],
  services: [
    { name: "name", label: "Service name" },
    { name: "desc", label: "Description", type: "textarea" },
    {
      name: "img",
      label: "Preview image (portrait)",
      type: "image",
      aspectRatio: 234 / 259,
    },
    {
      name: "background",
      label: "Background image (16:9, optional — display order must not be 1)",
      type: "image",
      optional: true,
      aspectRatio: 16 / 9,
    },
  ],
  testimonials: [
    { name: "name", label: "Client name" },
    { name: "company", label: "Company / location" },
    { name: "quote", label: "Testimonial", type: "textarea" },
    { name: "photo", label: "Client photo", type: "image" },
  ],
  faqs: [
    { name: "q", label: "Question" },
    { name: "ans", label: "Answer", type: "textarea" },
  ],
};

function assertManagedCollection(
  collectionName: string,
): asserts collectionName is ManagedCollection {
  if (!managedCollections.some((name) => name === collectionName)) {
    throw new Error(`Unsupported admin collection: ${collectionName}`);
  }
}

export async function listContent(collectionName: ManagedCollection, search = "") {
  assertManagedCollection(collectionName);
  const db = getFirebaseDb();
  const result = await getDocs(
    query(collection(db, collectionName), orderBy("order", "asc")),
  );
  const normalizedSearch = search.trim().toLowerCase();
  return result.docs
    .map((item) => ({ ...item.data(), id: item.id }) as ManagedRecord)
    .filter((item) =>
      normalizedSearch
        ? Object.entries(item).some(
            ([key, value]) =>
              key !== "id" && String(value).toLowerCase().includes(normalizedSearch),
          )
        : true,
    );
}

export async function saveContent(
  collectionName: ManagedCollection,
  id: string | null,
  value: DocumentData,
) {
  assertManagedCollection(collectionName);
  const db = getFirebaseDb();
  if (id) {
    await setDoc(doc(db, collectionName, id), value, { merge: true });
    return id;
  }
  return (await addDoc(collection(db, collectionName), value)).id;
}

export async function removeContent(collectionName: ManagedCollection, id: string) {
  assertManagedCollection(collectionName);
  await deleteDoc(doc(getFirebaseDb(), collectionName, id));
}

export async function listLeads(search = "") {
  const db = getFirebaseDb();
  const result = await getDocs(
    query(collection(db, "leads"), orderBy("createdAt", "desc")),
  );
  const normalizedSearch = search.trim().toLowerCase();
  return result.docs
    .map((item) => ({ ...item.data(), id: item.id }) as ManagedRecord)
    .filter((item) =>
      normalizedSearch
        ? Object.entries(item).some(
            ([key, value]) =>
              key !== "id" && String(value).toLowerCase().includes(normalizedSearch),
          )
        : true,
    );
}

export async function updateLeadStatus(id: string, status: string) {
  if (!["New", "Contacted", "Won"].includes(status)) {
    throw new Error(`Unsupported lead status: ${status}`);
  }
  await updateDoc(doc(getFirebaseDb(), "leads", id), { status });
}

export async function listSubscribers(search = "") {
  const result = await getDocs(
    query(collection(getFirebaseDb(), "newsletter"), orderBy("createdAt", "desc")),
  );
  const normalizedSearch = search.trim().toLowerCase();
  return result.docs
    .map((item) => ({ ...item.data(), id: item.id }) as ManagedRecord)
    .filter(
      (item) =>
        !normalizedSearch ||
        String(item.email ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
    );
}

export async function deleteSubscriber(id: string) {
  await deleteDoc(doc(getFirebaseDb(), "newsletter", id));
}

export async function listPublishedContentCounts() {
  const db = getFirebaseDb();
  const pairs = await Promise.all(
    managedCollections.map(async (name) => {
      const items = await getDocs(collection(db, name));
      return [
        name,
        {
          total: items.size,
          published: items.docs.filter((item) => item.data().status === "Published")
            .length,
        },
      ] as const;
    }),
  );
  return Object.fromEntries(pairs) as Record<
    ManagedCollection,
    { total: number; published: number }
  >;
}

export async function loadSettings() {
  const result = await getDoc(doc(getFirebaseDb(), "siteSettings", "main"));
  return result.exists() ? result.data() : {};
}

export async function saveSettings(value: DocumentData) {
  await setDoc(doc(getFirebaseDb(), "siteSettings", "main"), value, {
    merge: true,
  });
}
