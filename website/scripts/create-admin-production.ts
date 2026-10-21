import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [emailInput, keyPath, confirmation] = process.argv.slice(2);
const email = emailInput?.trim().toLowerCase();
const password = process.env.KITARI_ADMIN_PASSWORD;

if (
  !email ||
  !keyPath ||
  (confirmation !== "--confirm-project=kitaristudios" &&
    process.env.KITARI_ADMIN_CONFIRM_PROJECT !== "kitaristudios")
) {
  throw new Error(
    "Usage: npm run create-admin:production -- <email> <service-account.json> --confirm-project=kitaristudios",
  );
}
const targetEmail: string = email;
const serviceAccountPath: string = keyPath;
if (!password || password.length < 8) {
  throw new Error(
    "Set KITARI_ADMIN_PASSWORD to a unique password with at least 8 characters before running this script.",
  );
}
const accountPassword: string = password;
if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    "Unset emulator host variables before creating a production admin account.",
  );
}

const key = JSON.parse(readFileSync(resolve(serviceAccountPath), "utf8")) as {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};
if (key.project_id !== "kitaristudios" || !key.client_email || !key.private_key) {
  throw new Error(
    "The service-account key does not belong to kitaristudios or is invalid.",
  );
}
const projectId: string = key.project_id;
const serviceAccountEmail: string = key.client_email;
const serviceAccountPrivateKey: string = key.private_key;

const localEnvPath = resolve(process.cwd(), ".env.local");
const localEnv = readFileSync(localEnvPath, "utf8");
const apiKey = localEnv
  .split(/\r?\n/)
  .find((line) => line.startsWith("NEXT_PUBLIC_FIREBASE_API_KEY="))
  ?.slice("NEXT_PUBLIC_FIREBASE_API_KEY=".length)
  .trim();
if (!apiKey) {
  throw new Error("Firebase Web API key is missing from website/.env.local.");
}
const firebaseApiKey: string = apiKey;

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: serviceAccountEmail,
      privateKey: serviceAccountPrivateKey,
    }),
    projectId,
  });

async function firebaseRequest(
  endpoint: string,
  body: Record<string, string | boolean>,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "object" &&
      result.error !== null &&
      "message" in result.error &&
      typeof result.error.message === "string"
        ? result.error.message
        : `Firebase Authentication returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  if (typeof result !== "object" || result === null) {
    throw new Error("Firebase Authentication returned an invalid response.");
  }
  return result as Record<string, unknown>;
}

async function createProductionAdmin() {
  const authResponse = await firebaseRequest("accounts:signUp", {
    email: targetEmail,
    password: accountPassword,
    returnSecureToken: true,
  });
  const uid = authResponse.localId;
  const idToken = authResponse.idToken;
  if (typeof uid !== "string" || typeof idToken !== "string") {
    throw new Error("Firebase Authentication did not return an account and session.");
  }

  const auth = getAuth(app);
  const user = await auth.getUser(uid);
  if (user.email?.toLowerCase() !== targetEmail) {
    throw new Error(
      "The created Firebase account email did not match the requested address.",
    );
  }
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });

  await firebaseRequest("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
  });

  console.info(`Created the Firebase admin account for ${targetEmail}.`);
  console.info("A Firebase email-verification message was requested.");
  console.info(
    "Admin access stays blocked by Firestore Rules until that email is verified.",
  );
}

createProductionAdmin().catch((error: unknown) => {
  console.error("Could not complete production admin setup:", error);
  process.exitCode = 1;
});
