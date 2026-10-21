import Image from "next/image";
import Link from "next/link";
import { siteSettings, statistics } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="about-section" id="about">
      <div className="content-wrap">
        <Eyebrow>About Kitari</Eyebrow>
        <h2 className="about-statement" id="about-title">
          {siteSettings.aboutText}
        </h2>
        <Link className="pill-link" href="/contact">
          Book a Call <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="statistics-wrap">
        <div aria-label="Kitari Studio at a glance" className="statistics-grid">
          {statistics.slice(0, 2).map((stat) => (
            <div className="stat-item" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
          <div className="statistics-image">
            <Image
              alt="Glorius Studio website project preview"
              fill
              sizes="(max-width: 720px) 50vw, 335px"
              src={cloudinaryImage("rectangle-25.webp")}
            />
          </div>
          {statistics.slice(2).map((stat) => (
            <div className="stat-item" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
