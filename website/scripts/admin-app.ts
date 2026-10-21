import { getApps, initializeApp } from "firebase-admin/app";

export function requireEmulator(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required. Run this script through the Firebase Emulator Suite; it will not write to a cloud project.`,
    );
  }
  const host = new URL(`http://${value}`).hostname;
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw new Error(`${name} must point to a local emulator host.`);
  }
  return value;
}

export function getLocalAdminApp() {
  requireEmulator("FIRESTORE_EMULATOR_HOST");
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("GCLOUD_PROJECT must be set by the Firebase Emulator Suite.");
  }
  return (
    getApps()[0] ??
    initializeApp({
      projectId,
    })
  );
}
