import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

export function WorkSection() {
  return (
    <section aria-labelledby="work-title" className="work-section" id="work">
      <div className="content-wrap">
        <div className="work-heading">
          <div>
            <Eyebrow>Our Work</Eyebrow>
            <h2 id="work-title">Some Ideas We&apos;ve Helped Bring to Life</h2>
          </div>
          <p>
            Every project comes with its own story, challenge, and direction. Here are a
            few we&apos;ve had the chance to shape along the way.
          </p>
        </div>

        <div className="project-list">
          {projects
            .filter((project) => project.status === "Published")
            .sort((a, b) => a.order - b.order)
            .map((project) => (
              <article className="project-row" key={project.title}>
                <div className="project-copy">
                  <div>
                    <div className="project-title-line">
                      <h3>{project.title}</h3>
                      <span>{project.country}</span>
                    </div>
                    <p>{project.desc}</p>
                  </div>
                  <div className="project-footer">
                    <Link className="text-link" href="/contact">
                      Discuss a similar project <span aria-hidden="true">↗</span>
                    </Link>
                    <span>{project.year}</span>
                  </div>
                </div>
                <figure className="project-image">
                  <Image
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 900px) 100vw, 60vw"
                    src={cloudinaryImage(project.img)}
                  />
                  <div aria-label="Project services" className="project-tags">
                    {project.tagsList.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </figure>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
