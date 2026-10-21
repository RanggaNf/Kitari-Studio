"use client";

/* eslint @next/next/no-img-element: off */
import { useEffect, useState } from "react";
import Link from "next/link";
import { PortfolioEnding } from "@/components/homepage-ending";
import { loadPublishedProjects, type ProjectContent } from "@/lib/data/homepage-content";
import { resolveProjectImage } from "@/lib/data/projects";

type ProjectDetailProps = {
  slug: string;
  projects?: ProjectContent[];
  projectsLoading?: boolean;
  projectsError?: string;
};

export function ProjectDetail({
  slug,
  projects,
  projectsLoading,
  projectsError,
}: ProjectDetailProps) {
  const [result, setResult] = useState<{
    slug: string;
    project: ProjectContent | null;
    loading: boolean;
    error: string;
  }>({ slug, project: null, loading: true, error: "" });
  const hasSharedProjects = projectsLoading !== undefined;
  const currentResult =
    result.slug === slug ? result : { slug, project: null, loading: true, error: "" };
  const project = hasSharedProjects
    ? (projects?.find((item) => item.slug === slug) ?? null)
    : currentResult.project;
  const loading = hasSharedProjects ? projectsLoading : currentResult.loading;
  const error = hasSharedProjects ? (projectsError ?? "") : currentResult.error;

  useEffect(() => {
    if (hasSharedProjects) return;
    let active = true;
    void loadPublishedProjects()
      .then((projects) => {
        if (active) {
          setResult({
            slug,
            project: projects.find((item) => item.slug === slug) ?? null,
            loading: false,
            error: "",
          });
        }
      })
      .catch((reason: unknown) => {
        console.error(`Could not load project "${slug}".`, reason);
        if (active) {
          setResult({
            slug,
            project: null,
            loading: false,
            error: "This project could not be loaded right now.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [hasSharedProjects, slug]);

  useEffect(() => {
    if (project) document.title = `${project.title} | Kitari Studio`;
  }, [project]);

  if (loading) {
    return (
      <div className="prototype-page">
        <main className="prototype-page portfolio-page">
          <header className="portfolio-header">
            <Link className="contact-page-brand" href="/">
              Kitari Studio
            </Link>
            <div className="project-loading-actions">
              <div
                className="project-loading-status"
                role="status"
                aria-label="Loading project"
              >
                <span aria-hidden="true" className="project-loading-spinner" />
              </div>
              <Link className="contact-page-back" href="/work">
                <span aria-hidden="true">←</span> All Project
              </Link>
            </div>
          </header>
          <span className="sr-only">Loading project…</span>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="prototype-page">
        <main className="prototype-page portfolio-page">
          <p className="portfolio-state" role={error ? "alert" : "status"}>
            {error || "This project is not available."}
          </p>
          <Link className="portfolio-back-link" href="/work">
            Back to all work
          </Link>
        </main>
      </div>
    );
  }

  const gallery = [...new Set(project.gallery)]
    .filter((image) => image && image !== project.img)
    .slice(0, 3);

  return (
    <div className="prototype-page">
      <main className="prototype-page portfolio-page">
        <header className="portfolio-header">
          <Link className="contact-page-brand" href="/">
            Kitari Studio
          </Link>
          <Link className="contact-page-back" href="/work">
            <span aria-hidden="true">←</span> All Project
          </Link>
        </header>
        <article className="project-detail">
          <div className="project-detail-heading">
            <div>
              <h1>{project.title}</h1>
              <p className="project-detail-intro">{project.desc}</p>
            </div>
            {project.websiteUrl && (
              <a
                className="project-detail-website"
                href={project.websiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Website <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <figure className="project-detail-cover">
            <img
              alt={project.imageAlt || `${project.title} project cover`}
              fetchPriority="high"
              src={resolveProjectImage(project.img)}
            />
            <figcaption className="project-detail-meta">
              <span>
                <b>Client</b>
                {project.client || "Client not specified"}
              </span>
              <span>
                <b>Location</b>
                {project.country}
              </span>
              <span>
                <b>Year</b>
                {project.year}
              </span>
              <div className="project-detail-tags">
                <b>Services</b>
                {project.tagsList.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </figcaption>
          </figure>
          <div className="project-detail-copy">
            {project.overview && (
              <section>
                <h2>Overview</h2>
                <p>{project.overview}</p>
              </section>
            )}
            {project.challenge && (
              <section>
                <h2>The Problem</h2>
                <p>{project.challenge}</p>
              </section>
            )}
            {project.solution && (
              <section>
                <h2>The Solutions</h2>
                <p>{project.solution}</p>
              </section>
            )}
            {project.outcome && (
              <section>
                <h2>The Results</h2>
                <p>{project.outcome}</p>
              </section>
            )}
            {project.clientComment && (
              <section className="project-client-comment">
                <h2>Client comment</h2>
                <blockquote>
                  <p>“{project.clientComment}”</p>
                  <cite>{project.client || "Project client"}</cite>
                </blockquote>
              </section>
            )}
          </div>
          <div aria-label="Project detail images" className="project-detail-gallery">
            {Array.from({ length: 3 }, (_, index) => {
              const image = gallery[index];
              return (
                <figure
                  className={image ? undefined : "is-placeholder"}
                  key={`${image || "placeholder"}-${index}`}
                >
                  {image ? (
                    <img
                      alt={`${project.title} project image ${index + 1}`}
                      loading="lazy"
                      src={resolveProjectImage(image)}
                    />
                  ) : (
                    <div
                      aria-label={`Detail image ${index + 1} placeholder`}
                      className="project-detail-placeholder"
                      role="img"
                    >
                      <span>Project image {index + 1}</span>
                    </div>
                  )}
                </figure>
              );
            })}
          </div>
        </article>
      </main>
      <PortfolioEnding />
    </div>
  );
}
