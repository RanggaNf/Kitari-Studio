import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsIndex } from "@/components/projects/projects-index";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Explore all published branding, website, mobile app, and digital product projects by Kitari Studio.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <div className="prototype-page">
          <main className="prototype-page portfolio-page">
            <p className="portfolio-state" role="status">
              Loading projects…
            </p>
          </main>
        </div>
      }
    >
      <ProjectsIndex />
    </Suspense>
  );
}
