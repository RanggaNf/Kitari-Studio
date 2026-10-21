import { FirebaseError } from "firebase/app";

export function submissionErrorMessage(error: unknown, type: "lead" | "newsletter") {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied" && type === "newsletter") {
      return "This address may already be subscribed, or the service is not configured yet. Please contact us if the issue continues.";
    }
    if (error.code === "permission-denied") {
      return "We couldn’t send your inquiry. Please email hello@kitaristudio.com if the issue continues.";
    }
    if (error.code === "unavailable") {
      return "The connection is unavailable. Please check your internet connection and try again.";
    }
    return `We couldn’t complete this request (${error.code}). Please try again later.`;
  }
  return error instanceof Error
    ? error.message
    : "We couldn’t complete this request. Please try again later.";
}
