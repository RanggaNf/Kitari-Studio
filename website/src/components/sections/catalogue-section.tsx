import Image from "next/image";
import Link from "next/link";
import { catalogue } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

export function CatalogueSection() {
  return (
    <section
      aria-labelledby="catalogue-title"
      className="catalogue-section"
      id="catalogue"
    >
      <div className="content-wrap">
        <div className="section-heading catalogue-heading">
          <Eyebrow>Service Catalogue</Eyebrow>
          <h2 id="catalogue-title">Find What Your Brand Needs to Grow</h2>
        </div>

        <div className="catalogue-grid">
          {catalogue
            .filter((item) => item.status === "Published")
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <article className="catalogue-item" key={item.name}>
                <figure className="catalogue-image">
                  <Image
                    alt={`${item.name} design preview`}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    src={cloudinaryImage(item.img)}
                  />
                  <Link className="catalogue-action" href="/contact">
                    Book a Call <span aria-hidden="true">↗</span>
                  </Link>
                </figure>
                <div className="catalogue-meta">
                  <h3>{item.name}</h3>
                  <p>
                    Start from <strong>{item.price}</strong>
                  </p>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
