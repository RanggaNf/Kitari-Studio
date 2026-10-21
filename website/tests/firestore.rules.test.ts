import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const projectId = "kitaristudios";
const rules = readFileSync(resolve(process.cwd(), "../firestore.rules"), "utf8");
let environment: RulesTestEnvironment;

const validLead = () => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  projectType: "Website",
  message: "I need a new website.",
  status: "New",
  createdAt: serverTimestamp(),
});

const validNewsletter = () => ({
  email: "ada@example.com",
  createdAt: serverTimestamp(),
});

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

afterEach(async () => {
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment.cleanup();
});

describe("Firestore access rules", () => {
  it("allows public reads only for published content", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "projects", "published"), {
        title: "Public project",
        status: "Published",
        order: 1,
      });
      await setDoc(doc(db, "projects", "draft"), {
        title: "Private draft",
        status: "Draft",
        order: 2,
      });
    });

    const db = environment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "projects", "published")));
    await assertFails(getDoc(doc(db, "projects", "draft")));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, "projects"),
          where("status", "==", "Published"),
          orderBy("order", "asc"),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, "projects")));
  });

  it("allows a public lead create but rejects invalid fields and changes", async () => {
    const db = environment.unauthenticatedContext().firestore();
    const lead = doc(collection(db, "leads"));
    await assertSucceeds(setDoc(lead, validLead()));
    await assertFails(getDoc(lead));
    await assertFails(updateDoc(lead, { status: "Won" }));
    await assertFails(deleteDoc(lead));
    await assertFails(
      setDoc(doc(collection(db, "leads")), {
        ...validLead(),
        status: "Won",
        privateNote: "not allowed",
      }),
    );
    await assertFails(
      setDoc(doc(collection(db, "leads")), {
        ...validLead(),
        message: "x".repeat(4001),
      }),
    );
  });

  it("allows private newsletter create only once and blocks public reads", async () => {
    const db = environment.unauthenticatedContext().firestore();
    const subscriber = doc(
      db,
      "newsletter",
      "a".repeat(64),
    );
    await assertSucceeds(setDoc(subscriber, validNewsletter()));
    await assertFails(getDoc(subscriber));
    await assertFails(setDoc(subscriber, validNewsletter()));
    await assertFails(
      setDoc(doc(db, "newsletter", "invalid-id"), validNewsletter()),
    );
  });

  it("allows admins to read leads and manage content", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "projects", "draft"), {
        status: "Draft",
        order: 1,
      });
    });
    const db = environment.authenticatedContext("admin-user", {
      admin: true,
      email_verified: true,
    }).firestore();
    const lead = doc(db, "leads", "lead-1");
    const project = doc(db, "projects", "project-1");
    await assertSucceeds(getDoc(doc(db, "siteSettings", "main")));
    await assertSucceeds(
      setDoc(doc(db, "siteSettings", "main"), { title: "Kitari", location: "Malang" }),
    );
    await assertSucceeds(getDoc(doc(db, "projects", "draft")));
    await assertSucceeds(getDocs(collection(db, "projects")));
    await assertSucceeds(setDoc(lead, validLead()));
    await assertSucceeds(getDoc(lead));
    await assertSucceeds(setDoc(project, { status: "Draft", order: 1 }));
    await assertSucceeds(updateDoc(project, { status: "Published" }));
    await assertSucceeds(deleteDoc(project));
  });

  it("denies content writes to users without the admin claim", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "services", "draft"), {
        status: "Draft",
        order: 1,
      });
    });
    const db = environment.authenticatedContext("regular-user", {
      admin: true,
      email_verified: false,
    }).firestore();
    await assertFails(getDoc(doc(db, "services", "draft")));
    await assertFails(getDocs(collection(db, "services")));
    await assertFails(
      setDoc(doc(db, "services", "unsafe"), {
        name: "Unapproved",
        status: "Published",
        order: 1,
      }),
    );
  });
});
