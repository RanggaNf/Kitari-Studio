"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "./client";

export type AdminSession = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<AdminSession>({
    user: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    async function initializeSession() {
      try {
        await Promise.resolve();
        if (!active) return;
        unsubscribe = onAuthStateChanged(
          getFirebaseAuth(),
          async (user) => {
            if (!user) {
              if (active) {
                setSession({ user: null, isAdmin: false, loading: false, error: null });
              }
              return;
            }
            try {
              const token = await user.getIdTokenResult();
              if (active) {
                setSession({
                  user,
                  isAdmin:
                    token.claims.admin === true && token.claims.email_verified === true,
                  loading: false,
                  error: null,
                });
              }
            } catch (error) {
              if (active) {
                setSession({
                  user,
                  isAdmin: false,
                  loading: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Could not verify admin access.",
                });
              }
            }
          },
          (error) => {
            if (active) {
              setSession({
                user: null,
                isAdmin: false,
                loading: false,
                error: error.message,
              });
            }
          },
        );
      } catch (error) {
        if (active) {
          setSession({
            user: null,
            isAdmin: false,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not initialize Firebase Authentication.",
          });
        }
      }
    }
    void initializeSession();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return session;
}

export async function signOutAdmin() {
  await signOut(getFirebaseAuth());
}

export function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/network-request-failed": "Network error. Check your connection and retry.",
    "auth/operation-not-allowed":
      "Email/password sign-in is not enabled in Firebase Authentication.",
    "auth/weak-password": "Use a stronger password.",
  };
  return (
    messages[code] ??
    (error instanceof Error ? error.message : "Authentication failed. Please try again.")
  );
}
