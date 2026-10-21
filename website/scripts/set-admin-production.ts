import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [emailInput, keyPath, confirmation] = process.argv.slice(2);
const email = emailInput?.trim().toLowerCase();
if (
  !email ||
  !keyPath ||
  (confirmation !== "--confirm-project=kitaristudios" &&
    process.env.KITARI_ADMIN_CONFIRM_PROJECT !== "kitaristudios")
) {
  throw new Error(
    "Usage: npm run set-admin:production -- <email> <service-account.json> --confirm-project=kitaristudios",
  );
}
if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    "Unset emulator host variables before changing a production admin claim.",
  );
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

async function setProductionAdmin() {
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  if (!user.emailVerified) {
    throw new Error("Verify the administrator email address before assigning its claim.");
  }
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });
  console.info(`Admin claim assigned to ${email} in Firebase project kitaristudios.`);
  console.info("The user must sign out and sign in again to refresh the claim.");
}

setProductionAdmin().catch((error: unknown) => {
  console.error("Could not assign the production admin claim:", error);
  process.exitCode = 1;
});
