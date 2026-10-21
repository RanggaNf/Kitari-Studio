"use client";

/* eslint @next/next/no-img-element: off */

import { useEffect, useState } from "react";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { fallbackContent } from "@/data/homepage-fallback";
import type { SiteSettings } from "@/lib/data/schemas";
import { cloudinaryImage } from "@/lib/cloudinary/assets";
import { getPublicSiteSettings } from "@/lib/data/public-data";

const recentWorks = [
  { title: "Contractor", slug: "contractor-management" },
  { title: "Amiya Rosa", slug: "amiya-rosa" },
  { title: "Glorius Studio", slug: null },
  { title: "Shaistanaya City", slug: "shaistanaya-city" },
];

const arrowPath = "M6 14 14 6M7 6h7v7";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 20 20"
      width="20"
    >
      <path d={arrowPath} />
    </svg>
  );
}

export function HomepageCta({
  workHref = "#work",
  settings = fallbackContent.settings,
}: {
  workHref?: string;
  settings?: SiteSettings;
}) {
  return (
    <section className="cta" id="contact-cta">
      <img
        alt=""
        className="ph"
        src={cloudinaryImage("rectangle-25.png")}
        style={{
          height: 260,
          left: "calc(50% - 6px + 252px)",
          top: 26,
          transform: "rotate(-12deg)",
          width: 230,
        }}
      />
      <img
        alt=""
        className="ph"
        src={cloudinaryImage("rectangle-26.png")}
        style={{
          height: 260,
          left: "calc(50% - 562px)",
          top: 419,
          transform: "rotate(-15deg)",
          width: 230,
        }}
      />
      <img
        alt=""
        className="ph"
        src={cloudinaryImage("rectangle-29.png")}
        style={{
          height: 200,
          left: "calc(50% + 326px)",
          top: 466,
          transform: "rotate(9.43deg)",
          width: 190,
        }}
      />
      <img
        alt=""
        className="ph"
        src={cloudinaryImage("rectangle-28.png")}
        style={{
          height: 200,
          left: "calc(50% - 526px)",
          top: 48,
          transform: "rotate(9.43deg)",
          width: 190,
        }}
      />
      <div className="cta-in">
        <h2>{settings.homeCtaHeading ?? fallbackContent.settings.homeCtaHeading}</h2>
        <div className="cta-btns">
          <a className="pill" href="/contact">
            {settings.homeBookCall ?? fallbackContent.settings.homeBookCall}
            <i>
              <ArrowIcon />
            </i>
          </a>
          <a className="link" href={workHref}>
            {settings.homeCtaWorkLink ?? fallbackContent.settings.homeCtaWorkLink}{" "}
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

export function HomepageFooter({
  settings = fallbackContent.settings,
  homePath = "",
}: {
  settings?: SiteSettings;
  homePath?: string;
}) {
  const homeHref = (section: string) => `${homePath}#${section}`;
  const inquiryNumber = settings.whatsapp || settings.phone;
  const inquiryDigits = inquiryNumber.replace(/\D/g, "");
  const normalizedInquiryNumber = inquiryDigits.startsWith("0")
    ? `62${inquiryDigits.slice(1)}`
    : inquiryDigits.startsWith("62")
      ? inquiryDigits
      : `62${inquiryDigits}`;
  const displayInquiryNumber =
    normalizedInquiryNumber === "6289512842356" ? "+62 895 1284 2356" : inquiryNumber;
  const copy = { ...fallbackContent.settings, ...settings };

  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div className="f1">
            <h4>{settings.title}</h4>
            <p>{copy.homeFooterDescription}</p>
            <div className="soc">
              <a
                aria-label={copy.homeFooterInstagram}
                href={settings.instagramUrl || "#"}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z" />
                </svg>
              </a>
              <a aria-label={copy.homeFooterTikTok} href={settings.tiktokUrl || "#"}>
                <svg viewBox="0 0 24 24">
                  <path d="M19.6 6.3a4.8 4.8 0 0 1-3-2.6A4.8 4.8 0 0 1 16.2 2h-3.3v13.4a2.8 2.8 0 1 1-2-2.7V9.3a6.1 6.1 0 1 0 5.3 6.1V8.7a8 8 0 0 0 4.7 1.5V6.9a4.8 4.8 0 0 1-1.3-.6z" />
                </svg>
              </a>
              <a aria-label={copy.homeFooterFacebook} href={settings.facebookUrl || "#"}>
                <svg viewBox="0 0 24 24">
                  <path d="M14 8V6.5c0-.7.5-1 1-1h2V2h-3c-3 0-4.5 2-4.5 4.5V8H7v3.5h2.5V22H14V11.5h2.8l.5-3.5z" />
                </svg>
              </a>
              <a aria-label={copy.homeFooterYouTube} href="#">
                <svg viewBox="0 0 24 24">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="fcols">
            <div className="fc footer-pages">
              <h5>{copy.homeFooterPagesHeading}</h5>
              <a href={homeHref("home")}>{copy.homeFooterHomeLink}</a>
              <a href={homeHref("services")}>{copy.homeFooterServicesLink}</a>
              <a href={homeHref("work")}>{copy.homeFooterPortfolioLink}</a>
              <a href="#">{copy.homeFooterWhiteLabelLink}</a>
            </div>
            <div className="fc footer-recent-works">
              <h5>{copy.homeFooterRecentWorksHeading}</h5>
              {recentWorks.map((project, index) => (
                <a
                  href={
                    project.slug
                      ? `/work?project=${encodeURIComponent(project.slug)}`
                      : "/work"
                  }
                  key={project.slug ?? project.title}
                >
                  {[
                    copy.homeFooterRecentWork1,
                    copy.homeFooterRecentWork2,
                    copy.homeFooterRecentWork3,
                    copy.homeFooterRecentWork4,
                  ][index] ?? project.title}
                </a>
              ))}
            </div>
            <div className="fc footer-socials">
              <h5>{copy.homeFooterSocialsHeading}</h5>
              <a href={settings.instagramUrl || "#"}>{copy.homeFooterInstagram}</a>
              <a href={settings.linkedinUrl || "#"}>{copy.homeFooterLinkedIn}</a>
              <a href={settings.tiktokUrl || "#"}>{copy.homeFooterTikTok}</a>
              <a href={settings.facebookUrl || "#"}>{copy.homeFooterFacebook}</a>
              <a href="#">{copy.homeFooterYouTube}</a>
            </div>
            <div className="fc footer-location">
              <h5>{copy.homeFooterLocationHeading}</h5>
              <span>{settings.location}</span>
            </div>
          </div>
        </div>
        <div className="f2">
          <div className="news">
            <h5>{copy.homeFooterNewsletterHeading}</h5>
            <NewsletterForm settings={settings} />
          </div>
          <div className="f3">
            <div className="fc footer-inquiry">
              <h5>{copy.homeFooterInquiryHeading}</h5>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              <a href={`tel:+${normalizedInquiryNumber}`}>{displayInquiryNumber}</a>
            </div>
            <div className="fc footer-open-position">
              <h5>{copy.homeFooterOpenPositionHeading}</h5>
              <span>{copy.homeFooterOpenPosition1}</span>
              <span>{copy.homeFooterOpenPosition2}</span>
            </div>
          </div>
        </div>
        <p className="copy">{copy.homeFooterCopyright}</p>
      </div>
    </footer>
  );
}

export function PortfolioEnding() {
  const [settings, setSettings] = useState(fallbackContent.settings);

  useEffect(() => {
    let active = true;
    void getPublicSiteSettings()
      .then((loadedSettings) => {
        if (active && loadedSettings) setSettings(loadedSettings);
      })
      .catch((error: unknown) => {
        console.error("Could not load site settings for the portfolio footer.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <HomepageCta workHref="/work" settings={settings} />
      <HomepageFooter homePath="/" settings={settings} />
    </>
  );
}
