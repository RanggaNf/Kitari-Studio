"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPublicSiteSettings } from "@/lib/data/public-data";

const fonts = {
  Geist: "var(--font-geist-sans), system-ui, sans-serif",
  Arial: "Arial, Helvetica, sans-serif",
  Georgia: "Georgia, serif",
  "system-ui": "system-ui, sans-serif",
} as const;

export function SiteAppearanceSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let active = true;
    void getPublicSiteSettings()
      .then((settings) => {
        if (!active || !settings) return;
        const font = settings.siteFontFamily ?? "Geist";
        const scale = settings.siteTextScale ?? 1;
        document.documentElement.style.setProperty("--site-font-family", fonts[font]);
        document.documentElement.style.setProperty("--site-text-scale", String(scale));
        document.documentElement.style.setProperty(
          "--site-heading-scale",
          String(settings.siteHeadingScale ?? 1),
        );
        document.documentElement.style.setProperty(
          "--site-body-scale",
          String(settings.siteBodyScale ?? 1),
        );
        document.documentElement.style.setProperty(
          "--site-nav-scale",
          String(settings.siteNavScale ?? 1),
        );
        document.documentElement.style.setProperty(
          "--site-button-scale",
          String(settings.siteButtonScale ?? 1),
        );
      })
      .catch((reason: unknown) => {
        console.error("Could not load website appearance settings.", reason);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
