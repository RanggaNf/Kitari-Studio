import { getAuth } from "firebase-admin/auth";
import { getLocalAdminApp, requireEmulator } from "./admin-app";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  throw new Error("Usage: npm run set-admin -- <email>");
}
requireEmulator("FIREBASE_AUTH_EMULATOR_HOST");

const run = async () => {
  const auth = getAuth(getLocalAdminApp());
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });
  console.info(`Admin claim set for ${email} in the Auth emulator.`);
};

run().catch((error: unknown) => {
  console.error("Could not set the emulator admin claim:", error);
  process.exitCode = 1;
});
