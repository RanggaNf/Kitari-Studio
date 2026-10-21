import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fallbackContent } from "../src/data/homepage-fallback";

const [keyPath, confirmation, mode = "homepage"] = process.argv.slice(2);
if (
  !keyPath ||
  confirmation !== "kitaristudios" ||
  !["homepage", "settings"].includes(mode)
) {
  throw new Error(
    "Usage: npm run seed:production -- <service-account.json> kitaristudios [homepage|settings]",
  );
}
if (
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true"
) {
  throw new Error("Unset Firebase emulator settings before seeding production.");
}

const key = JSON.parse(readFileSync(resolve(keyPath), "utf8")) as {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};
if (key.project_id !== "kitaristudios" || !key.client_email || !key.private_key) {
  throw new Error(
    "The service-account key does not belong to kitaristudios or is invalid.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: key.project_id,
      clientEmail: key.client_email,
      privateKey: key.private_key,
    }),
    projectId: key.project_id,
  });
const db = getFirestore(app);
const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const documents = [
  ...fallbackContent.catalogue.map((item) => ({
    collection: "catalogue",
    id: slug(item.name),
    data: { ...item, title: item.name },
  })),
  ...fallbackContent.services.map((item) => ({
    collection: "services",
    id: slug(item.name),
    data: { ...item, description: item.desc },
  })),
  ...fallbackContent.projects.map((item) => ({
    collection: "projects",
    id: slug(item.title),
    data: { ...item, name: item.title, description: item.desc },
  })),
  ...fallbackContent.testimonials.map((item) => ({
    collection: "testimonials",
    id: slug(item.name),
    data: item,
  })),
  ...fallbackContent.faqs.map((item) => ({
    collection: "faqs",
    id: slug(item.q),
    data: { ...item, question: item.q, answer: item.ans },
  })),
];
const documentsToCreate =
  mode === "settings"
    ? [
        {
          collection: "siteSettings",
          id: "main",
          data: fallbackContent.settings,
        },
      ]
    : documents;

async function seedProduction() {
  const batch = db.batch();
  for (const document of documentsToCreate) {
    batch.create(db.collection(document.collection).doc(document.id), document.data);
  }
  await batch.commit();
  console.info(
    mode === "settings"
      ? "Created the default public site settings document in Firestore project kitaristudios."
      : `Published ${documents.length} homepage fallback documents to Firestore project kitaristudios. Existing documents and site settings were not changed.`,
  );
}

seedProduction().catch((error: unknown) => {
  console.error("Production seed failed; no existing documents were overwritten:", error);
  process.exitCode = 1;
});
