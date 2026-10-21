import Link from "next/link";

export function ContactSection() {
  return (
    <section aria-labelledby="contact-title" className="contact-section" id="contact-cta">
      <div aria-hidden="true" className="contact-decoration contact-decoration-one">
        <span>Kitari</span>
      </div>
      <div aria-hidden="true" className="contact-decoration contact-decoration-two">
        <span>Studio</span>
      </div>
      <div className="contact-content">
        <p className="eyebrow">Have a good idea?</p>
        <h2 id="contact-title">
          Have an idea in mind? Let&apos;s shape it, build it, and bring it into the
          world.
        </h2>
        <div className="contact-actions">
          <a className="pill-link" href="/contact">
            Book a Call <span aria-hidden="true">↗</span>
          </a>
          <Link className="text-link" href="#work">
            See Our Work <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
