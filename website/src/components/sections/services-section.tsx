import Image from "next/image";
import { services } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

export function ServicesSection() {
  return (
    <section aria-labelledby="services-title" className="services-section" id="services">
      <div aria-hidden="true" className="services-background" />
      <div className="content-wrap services-content">
        <div className="services-heading">
          <div>
            <Eyebrow>Services</Eyebrow>
            <h2 id="services-title">What We Can Build</h2>
          </div>
          <p>
            Every idea has a story to tell, and we help shape it into something worth
            experiencing.
          </p>
        </div>
        <ol className="services-list">
          {services
            .filter((service) => service.status === "Published")
            .sort((a, b) => a.order - b.order)
            .map((service, index) => (
              <li className="service-row" key={service.name}>
                <span className="service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{service.name}</h3>
                <p>{service.desc}</p>
                <Image
                  alt=""
                  className="service-preview"
                  height={220}
                  src={cloudinaryImage(service.img)}
                  width={180}
                />
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
