"use client";

import { useCallback, useSyncExternalStore } from "react";

export type AdminTheme = "light" | "dark";

const STORAGE_KEY = "kitari-admin-theme";
const CHANGE_EVENT = "kitari-admin-theme-changed";

// Keeps the choice for this tab when localStorage is blocked.
let memoryTheme: AdminTheme | null = null;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): AdminTheme {
  if (memoryTheme) return memoryTheme;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  return "light";
}

function getServerSnapshot(): AdminTheme {
  return "light";
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: AdminTheme) => {
    memoryTheme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore: the in-memory value still applies for this session.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
