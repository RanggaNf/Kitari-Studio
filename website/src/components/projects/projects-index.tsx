"use client";

/* eslint @next/next/no-img-element: off */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortfolioEnding } from "@/components/homepage-ending";
import { loadPublishedProjects, type ProjectContent } from "@/lib/data/homepage-content";
import { resolveProjectImage } from "@/lib/data/projects";
import { ProjectDetail } from "./project-detail";

const pageSize = 8;

function getPageNumbers(page: number, pageCount: number) {
  if (pageCount <= 6) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 3) return [1, 2, 3, "…", pageCount] as const;
  if (page >= pageCount - 2) {
    return [1, "…", pageCount - 2, pageCount - 1, pageCount] as const;
  }
  return [1, "…", page - 1, page, page + 1, "…", pageCount] as const;
}

export function ProjectsIndex() {
  const [projects, setProjects] = useState<ProjectContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const requestedSlug = useSearchParams().get("project") ?? "";

  useEffect(() => {
    let active = true;
    void loadPublishedProjects()
      .then((items) => {
        if (active) setProjects(items);
      })
      .catch((reason: unknown) => {
        console.error("Could not load the published project portfolio.", reason);
        if (active) {
          setError("Projects could not be loaded right now. Please try again later.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (requestedSlug) {
    return (
      <ProjectDetail
        slug={requestedSlug}
        projects={projects}
        projectsError={error}
        projectsLoading={loading}
      />
    );
  }

  const orderedProjects = [...projects].sort(
    (first, second) =>
      Number(second.featured) - Number(first.featured) || first.order - second.order,
  );
  const pageCount = Math.max(1, Math.ceil(orderedProjects.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const visibleProjects = orderedProjects.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  return (
    <div className="prototype-page">
      <main className="prototype-page portfolio-page">
        <header className="portfolio-header">
          <Link className="contact-page-brand" href="/">
            Kitari Studio
          </Link>
          <Link className="contact-page-back" href="/">
            Back to Website <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <section aria-labelledby="portfolio-title" className="portfolio-content">
          <h1 id="portfolio-title">Our Work</h1>

          {loading && <p role="status">Loading projects…</p>}
          {error && (
            <p className="portfolio-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && orderedProjects.length === 0 && (
            <p>No projects have been published yet.</p>
          )}

          <div className="portfolio-grid">
            {visibleProjects.map((project) => (
              <article className="portfolio-card" key={project.slug}>
                <a
                  aria-label={`View ${project.title} project`}
                  className="portfolio-card-image"
                  href={`/work?project=${encodeURIComponent(project.slug)}`}
                >
                  <img
                    alt={project.imageAlt || `${project.title} project preview`}
                    loading="lazy"
                    src={resolveProjectImage(project.img)}
                  />
                  <div aria-label="Project services" className="portfolio-card-tags">
                    {project.tagsList.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </a>
                <div className="portfolio-card-copy">
                  <div className="portfolio-card-title">
                    <h2>{project.title}</h2>
                    <span>
                      {project.country} · {project.year}
                      {project.stage === "Coming soon" && " · Coming soon"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!loading && !error && (
            <nav aria-label="Project pages" className="portfolio-pagination">
              <button
                aria-label="Previous page"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                <span aria-hidden="true">‹</span>
              </button>
              {getPageNumbers(activePage, pageCount).map((page, index) =>
                page === "…" ? (
                  <span
                    aria-hidden="true"
                    className="portfolio-page-ellipsis"
                    key={`ellipsis-${index}`}
                  >
                    …
                  </span>
                ) : (
                  <button
                    aria-current={activePage === page ? "page" : undefined}
                    aria-label={`Page ${page}`}
                    className={activePage === page ? "is-active" : ""}
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    type="button"
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                aria-label="Next page"
                disabled={activePage === pageCount}
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                type="button"
              >
                <span aria-hidden="true">›</span>
              </button>
            </nav>
          )}
        </section>
      </main>
      <PortfolioEnding />
    </div>
  );
}
