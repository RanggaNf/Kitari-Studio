import type { Metadata } from "next";
import { fallbackContent } from "@/data/homepage-fallback";
import { ProjectDetail } from "@/components/projects/project-detail";
import { slugifyProjectTitle } from "@/lib/data/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Project detail",
  description: "Discover the story behind a Kitari Studio project.",
};

export function generateStaticParams() {
  return fallbackContent.projects.map((project) => ({
    slug: project.slug || slugifyProjectTitle(project.title),
  }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  return <ProjectDetail slug={slug} />;
}
