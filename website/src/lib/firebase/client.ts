import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

let emulatorDb: Firestore | null = null;
let emulatorAuth: Auth | null = null;

export function getFirebaseApp() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  if (!apiKey || !appId || !projectId || !authDomain) {
    throw new Error(
      "Firebase web configuration is missing. Copy website/.env.example to website/.env.local and fill in the Firebase Web App values.",
    );
  }

  const appName = "kitari-public";
  const config = {
    apiKey,
    appId,
    authDomain,
    projectId,
  };

  return getApps().some((app) => app.name === appName)
    ? getApp(appName)
    : initializeApp(config, appName);
}

export function getFirebaseDb() {
  const db = getFirestore(getFirebaseApp());
  if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true" && !emulatorDb) {
    const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
    const [hostname, portValue] = host.split(":");
    const port = Number(portValue);
    if (!hostname || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(
        "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST must use the host:port format.",
      );
    }
    connectFirestoreEmulator(db, hostname, port);
    emulatorDb = db;
  }
  return db;
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true" && !emulatorAuth) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
    const [hostname, portValue] = host.split(":");
    const port = Number(portValue);
    if (!hostname || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(
        "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST must use the host:port format.",
      );
    }
    connectAuthEmulator(auth, `http://${hostname}:${port}`, {
      disableWarnings: true,
    });
    emulatorAuth = auth;
  }
  return auth;
}
