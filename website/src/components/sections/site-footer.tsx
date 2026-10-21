import Link from "next/link";
import { siteSettings } from "@/data/site-content";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Our Work", href: "#work" },
  { label: "Catalogue", href: "#catalogue" },
  { label: "FAQs", href: "#faq" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="content-wrap">
        <div className="footer-main">
          <div className="footer-about">
            <Link className="footer-brand" href="#home">
              Kitari Studio
            </Link>
            <p>
              A creative studio helping businesses build brands, digital products,
              websites, and experiences that move them forward.
            </p>
            <a className="text-link" href={`mailto:${siteSettings.email}`}>
              {siteSettings.email}
            </a>
          </div>

          <div className="footer-navigation">
            <h2>Explore</h2>
            <nav aria-label="Footer navigation">
              {footerLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-location">
            <h2>Location</h2>
            <p>{siteSettings.location}</p>
            <a href={`tel:${siteSettings.phone.replaceAll(" ", "")}`}>
              {siteSettings.phone}
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Kitari Studio</span>
          <a href={`mailto:${siteSettings.email}`}>Get in touch</a>
        </div>
      </div>
    </footer>
  );
}
