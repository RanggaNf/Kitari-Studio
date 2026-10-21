import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/forms/lead-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell Kitari Studio about your project.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="prototype-page">
      <section aria-labelledby="contact-title" className="contact-page">
        <div aria-hidden="true" className="contact-page-glow" />
        <header className="contact-page-header">
          <Link className="contact-page-brand" href="/">
            Kitari Studio
          </Link>
          <Link className="contact-page-back" href="/">
            Back to website <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <div className="contact-page-content">
          <p className="eyebrow">START A PROJECT</p>
          <h1 id="contact-title">
            Have an idea in mind? Let’s shape it, build it, and bring it into the world.
          </h1>
          <p className="contact-page-intro">
            Share a few details and our team will be in touch.
          </p>
          <LeadForm />
        </div>
      </section>
    </main>
  );
}
