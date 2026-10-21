import Image from "next/image";
import Link from "next/link";
import { siteSettings } from "@/data/site-content";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

const heroImages = [
  { src: cloudinaryImage("rectangle-30.webp"), alt: "Personal analytics interface" },
  { src: cloudinaryImage("rectangle-31.webp"), alt: "Jewellery website design" },
  { src: cloudinaryImage("rectangle-29.webp"), alt: "Brand identity concept" },
  { src: cloudinaryImage("rectangle-26.webp"), alt: "Equestrian club website" },
  { src: cloudinaryImage("rectangle-28.webp"), alt: "Hotel booking website" },
  { src: cloudinaryImage("rectangle-25.webp"), alt: "Creative studio website" },
];

const navigation = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Our Work", href: "#work" },
  { label: "Catalogue", href: "#catalogue" },
  { label: "Testimonials", href: "#testimonial" },
  { label: "FAQ", href: "#faq" },
];

export function HeroSection() {
  return (
    <header className="hero-section" id="home">
      <nav aria-label="Main navigation" className="hero-nav">
        <Link aria-label="Kitari Studio home" className="hero-brand" href="#home">
          Kitari Studio
        </Link>
        <span className="hero-location">{siteSettings.location}</span>
        <div className="hero-nav-links">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <a className="hero-contact-link" href={`mailto:${siteSettings.email}`}>
          Schedule a Call <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <p className="hero-tagline">{siteSettings.heroTagline}</p>

      <div aria-hidden="true" className="hero-image-cluster">
        {heroImages.map((image, index) => (
          <Image
            alt={image.alt}
            className={`hero-image hero-image-${index + 1}`}
            height={220}
            key={image.src}
            src={image.src}
            width={180}
          />
        ))}
      </div>

      <h1 className="hero-wordmark">
        Kitari Studio<sup>©</sup>
      </h1>
    </header>
  );
}
