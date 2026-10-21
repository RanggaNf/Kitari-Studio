import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getLocalAdminApp, requireEmulator } from "./admin-app";

requireEmulator("FIREBASE_AUTH_EMULATOR_HOST");

const auth = getAuth(getLocalAdminApp());
const db = getFirestore(getLocalAdminApp());
const accounts = [
  {
    email: "kitari-admin@example.test",
    password: "AdminTestPass123!",
    admin: true,
    emailVerified: true,
  },
  {
    email: "kitari-regular@example.test",
    password: "RegularTestPass123!",
    admin: false,
    emailVerified: true,
  },
  {
    email: "kitari-unverified@example.test",
    password: "UnverifiedTestPass123!",
    admin: false,
    emailVerified: false,
  },
] as const;

async function prepare() {
  for (const account of accounts) {
    let user;
    try {
      user = await auth.getUserByEmail(account.email);
      user = await auth.updateUser(user.uid, {
        password: account.password,
        disabled: false,
        emailVerified: account.emailVerified,
      });
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== "auth/user-not-found"
      ) {
        throw error;
      }
      user = await auth.createUser({
        email: account.email,
        password: account.password,
        emailVerified: account.emailVerified,
      });
    }
    await auth.setCustomUserClaims(user.uid, account.admin ? { admin: true } : {});
  }
  const createdAt = Timestamp.now();
  await db.collection("leads").doc("admin-e2e-lead").set({
    name: "Admin QA Lead",
    email: "admin-qa@example.test",
    projectType: "Website",
    message: "Test lead details for the admin panel.",
    status: "New",
    createdAt,
  });
  await db.collection("newsletter").doc("e".repeat(64)).set({
    email: "admin-newsletter@example.test",
    createdAt,
  });
  await db.collection("siteSettings").doc("main").set(
    {
      title: "Kitari Studio",
      location: "Malang, Indonesia GMT+7",
      email: "hello@kitaristudio.com",
      phone: "+62 82392039",
      heroTagline: "We build brands and digital products.",
      aboutText: "Kitari Studio creates thoughtful digital experiences.",
    },
    { merge: true },
  );
  console.info("Prepared test accounts in the local Firebase Auth emulator.");
}

prepare().catch((error: unknown) => {
  console.error("Could not prepare admin panel emulator accounts:", error);
  process.exitCode = 1;
});
