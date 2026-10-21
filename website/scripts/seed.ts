import { getFirestore } from "firebase-admin/firestore";
import {
  catalogue,
  faqItems,
  projects,
  services,
  siteSettings,
  testimonials,
} from "../src/data/site-content";
import { getLocalAdminApp } from "./admin-app";

const db = getFirestore(getLocalAdminApp());
const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const documents: Array<{
  collection: string;
  id: string;
  data: Record<string, unknown>;
}> = [
  ...catalogue.map((item) => ({
    collection: "catalogue",
    id: slug(item.name),
    data: { ...item, title: item.name },
  })),
  ...services.map((item) => ({
    collection: "services",
    id: slug(item.name),
    data: { ...item, description: item.desc },
  })),
  ...projects.map((item) => ({
    collection: "projects",
    id: slug(item.title),
    data: { ...item, name: item.title, description: item.desc },
  })),
  ...testimonials.map((item) => ({
    collection: "testimonials",
    id: slug(item.name),
    data: { ...item },
  })),
  ...faqItems.map((item) => ({
    collection: "faqs",
    id: slug(item.q),
    data: { ...item, question: item.q, answer: item.ans },
  })),
];

const run = async () => {
  const batch = db.batch();
  batch.set(db.collection("siteSettings").doc("main"), siteSettings, {
    merge: true,
  });
  for (const document of documents) {
    batch.set(db.collection(document.collection).doc(document.id), document.data, {
      merge: true,
    });
  }
  await batch.commit();
  console.info(
    `Seeded site settings and ${documents.length} published content documents in the Firestore emulator.`,
  );
};

run().catch((error: unknown) => {
  console.error("Firestore emulator seed failed:", error);
  process.exitCode = 1;
});
