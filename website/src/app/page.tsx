/* eslint @next/next/no-img-element: off */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrototypeInteractions } from "@/components/prototype-interactions";
import { HomepageCta, HomepageFooter } from "@/components/homepage-ending";
import { fallbackContent } from "@/data/homepage-fallback";
import { loadHomepageContent } from "@/lib/data/homepage-content";
import { slugifyProjectTitle } from "@/lib/data/projects";
import { cloudinaryImage } from "@/lib/cloudinary/assets";

const image = cloudinaryImage;
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
      <path d={arrowPath} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Home() {
  const [content, setContent] = useState(fallbackContent);
  const [motionVersion, setMotionVersion] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const copy = { ...fallbackContent.settings, ...content.settings };
  const featuredProjects = [...content.projects]
    .sort(
      (first, second) =>
        Number(second.featured) - Number(first.featured) || first.order - second.order,
    )
    .slice(0, 3);
  const serviceBackgrounds = content.services.flatMap((service, index) =>
    service.order === 1
      ? []
      : [
          {
            serviceIndex: index,
            name: service.name,
            src: image(service.background || service.img),
          },
        ],
  );
  const heroCards = [
    {
      src:
        content.settings.heroCard1 ||
        fallbackContent.settings.heroCard1 ||
        image("rectangle-30.png"),
      left: 0,
      top: 0,
      rotate: 2,
      blur: 3,
    },
    {
      src:
        content.settings.heroCard2 ||
        fallbackContent.settings.heroCard2 ||
        image("rectangle-31.png"),
      left: 119,
      top: 34,
      rotate: -4,
      blur: 2,
    },
    {
      src:
        content.settings.heroCard3 ||
        fallbackContent.settings.heroCard3 ||
        image("rectangle-29.png"),
      left: 182,
      top: 134,
      rotate: -7,
      blur: 1,
    },
    {
      src:
        content.settings.heroCard4 ||
        fallbackContent.settings.heroCard4 ||
        image("rectangle-26.png"),
      left: 319,
      top: 189,
      rotate: -3,
      blur: 0.5,
    },
    {
      src:
        content.settings.heroCard5 ||
        fallbackContent.settings.heroCard5 ||
        image("rectangle-28.png"),
      left: 431,
      top: 120,
      rotate: 3,
      blur: 0,
    },
    {
      src:
        content.settings.heroCard6 ||
        fallbackContent.settings.heroCard6 ||
        image("rectangle-25.png"),
      left: 556,
      top: 85,
      rotate: 3,
      blur: 0,
    },
    {
      src:
        content.settings.heroCard7 ||
        fallbackContent.settings.heroCard7 ||
        image("rectangle-27.png"),
      left: 68,
      top: 188,
      rotate: 4,
      blur: 0,
    },
    {
      src:
        content.settings.heroCard8 ||
        fallbackContent.settings.heroCard8 ||
        image("rectangle-32.png"),
      left: 250,
      top: 14,
      rotate: -5,
      blur: 0,
    },
    {
      src:
        content.settings.heroCard9 ||
        fallbackContent.settings.heroCard9 ||
        image("rectangle-33.webp"),
      left: 365,
      top: 202,
      rotate: 2,
      blur: 0,
    },
    {
      src:
        content.settings.heroCard10 ||
        fallbackContent.settings.heroCard10 ||
        image("rectangle-50.webp"),
      left: 520,
      top: 220,
      rotate: -2,
      blur: 0,
    },
  ];

  useEffect(() => {
    let active = true;
    void loadHomepageContent(fallbackContent)
      .then((loadedContent) => {
        if (!active) return;
        setContent(loadedContent);
        setMotionVersion((version) => version + 1);
        document.title = loadedContent.settings.title;
      })
      .catch((error: unknown) => {
        console.error(
          "Could not load homepage content; keeping local fallback content.",
          error,
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <PrototypeInteractions contentVersion={motionVersion}>
      <div className="prototype-page">
        <header className="hero" id="home">
          <nav aria-label="Main" className="nav">
            <a className="brand" href="#home">
              {content.settings.title}
            </a>
            <span className="loc">{content.settings.location}</span>
            <button
              aria-controls="primary-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              className="nav-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
            <div
              className={`nav-r${mobileMenuOpen ? " mobile-open" : ""}`}
              id="primary-navigation"
            >
              <ul>
                <li>
                  <a className="on" href="#home" onClick={closeMobileMenu}>
                    {copy.homeNavHome ?? fallbackContent.settings.homeNavHome}
                  </a>
                </li>
                <li>
                  <a href="#about" onClick={closeMobileMenu}>
                    {copy.homeNavAbout}
                  </a>
                </li>
                <li>
                  <a href="#services" onClick={closeMobileMenu}>
                    {copy.homeNavServices}
                  </a>
                </li>
                <li>
                  <a href="#work" onClick={closeMobileMenu}>
                    {copy.homeNavWork}
                  </a>
                </li>
              </ul>
              <ul>
                <li>
                  <a href="#catalogue" onClick={closeMobileMenu}>
                    {copy.homeNavCatalogue}
                  </a>
                </li>
                <li>
                  <a href="#testimonial" onClick={closeMobileMenu}>
                    {copy.homeNavTestimonials}
                  </a>
                </li>
                <li>
                  <a href="#faq" onClick={closeMobileMenu}>
                    {copy.homeNavFaq}
                  </a>
                </li>
              </ul>
              <a className="link mobile-cta" href="/contact" onClick={closeMobileMenu}>
                {copy.homeScheduleCall ?? fallbackContent.settings.homeScheduleCall}{" "}
                <ArrowIcon />
              </a>
            </div>
            <a className="link" href="/contact">
              {copy.homeScheduleCall ?? fallbackContent.settings.homeScheduleCall}{" "}
              <ArrowIcon />
            </a>
          </nav>
          <p className="tag">{content.settings.heroTagline}</p>
          <span className="hero-interaction-hint">Swipe to explore</span>
          <div aria-hidden="true" className="cluster">
            {heroCards.map((card, index) => (
              <img
                alt=""
                key={index}
                src={image(card.src)}
                style={{
                  filter: card.blur ? `blur(${card.blur}px)` : undefined,
                  left: card.left,
                  top: card.top,
                  transform: `rotate(${card.rotate}deg)`,
                }}
              />
            ))}
          </div>
          <h1 className="hero-title">
            {content.settings.title}
            <sup>©</sup>
          </h1>
        </header>

        <main>
          <div className="cat-stage">
            <section className="cat" id="catalogue">
              <div className="wrap">
                <div className="cat-head">
                  <div className="eyebrow">{copy.homeCatalogueEyebrow}</div>
                  <h2>{copy.homeCatalogueTitle}</h2>
                </div>
                <div className="cards">
                  {content.catalogue.map((card) => (
                    <article className="card" key={card.name}>
                      <figure>
                        <img alt={`${card.name} preview`} src={image(card.img)} />
                        <a className="link" href="/contact">
                          {copy.homeBookCall} <ArrowIcon />
                        </a>
                      </figure>
                      <div className="meta">
                        {card.name}
                        <span>
                          {copy.homeStartingPrice} <b>{card.price}</b>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="about" id="about">
            <div className="wrap">
              <div className="eyebrow">{copy.homeAboutEyebrow}</div>
              <p className="big">{content.settings.aboutText}</p>
              <a className="pill" href="/contact">
                {copy.homeBookCall}
                <i>
                  <ArrowIcon />
                </i>
              </a>
            </div>
            <div className="zstage">
              <div className="zpin">
                <div className="wrap">
                  <div className="stats">
                    <div className="stat">
                      <b>{content.settings.aboutStat1Value || "5+"}</b>
                      <span>
                        {content.settings.aboutStat1Label ||
                          "Years of Experience in Creative Work"}
                      </span>
                    </div>
                    <div className="stat">
                      <b>{content.settings.aboutStat2Value || "40+"}</b>
                      <span>
                        {content.settings.aboutStat2Label ||
                          "Projects Completed for Businesses"}
                      </span>
                    </div>
                    <div className="zph" />
                    <div className="stat">
                      <b>{content.settings.aboutStat3Value || "30+"}</b>
                      <span>
                        {content.settings.aboutStat3Label ||
                          "Clients and Partners We’ve Worked With"}
                      </span>
                    </div>
                    <div className="stat">
                      <b>{content.settings.aboutStat4Value || "10+"}</b>
                      <span>
                        {content.settings.aboutStat4Label ||
                          "Countries Our Work Has Reached"}
                      </span>
                    </div>
                  </div>
                </div>
                <img
                  alt={content.settings.aboutImageAlt || "Kitari Studio project preview"}
                  className="zimg"
                  src={image(content.settings.aboutImage || "rectangle-25.png")}
                />
              </div>
            </div>
          </section>

          <div className="svc-stage">
            <section className="svc" id="services">
              <div aria-hidden="true" className="svc-background">
                {serviceBackgrounds.map((background) => (
                  <img
                    alt=""
                    className="svc-background-image"
                    data-service-index={background.serviceIndex}
                    key={`${background.name}-${background.serviceIndex}`}
                    src={background.src}
                  />
                ))}
              </div>
              <div className="wrap">
                <div className="svc-head">
                  <div>
                    <div className="eyebrow">{copy.homeServicesEyebrow}</div>
                    <h2>{copy.homeServicesTitle}</h2>
                  </div>
                  <p className="lead">{copy.homeServicesDescription}</p>
                </div>
                <div className="svc-list">
                  {content.services.map((service, index) => (
                    <div
                      className={`row${index === 0 ? " on" : ""}`}
                      key={service.name}
                      tabIndex={0}
                    >
                      <div className="l">
                        <span className="n">{String(index + 1).padStart(2, "0")}</span>
                        <h3>{service.name}</h3>
                      </div>
                      <p>{service.desc}</p>
                    </div>
                  ))}
                  <div aria-hidden="true" className="float">
                    {content.services.map((service, index) => (
                      <img
                        alt=""
                        className={index === 0 ? "on" : ""}
                        key={service.name}
                        src={image(service.img)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="work" id="work">
            <div className="wrap">
              <div className="work-head">
                <div>
                  <div className="eyebrow">{copy.homeWorkEyebrow}</div>
                  <h2>{copy.homeWorkTitle}</h2>
                </div>
                <p className="lead">{copy.homeWorkDescription}</p>
              </div>
              {featuredProjects.map((project) => (
                <article className="proj" key={project.title}>
                  <div className="txt">
                    <div className="top">
                      <div>
                        {project.title} <em>{project.country}</em>
                      </div>
                      <p>{project.desc}</p>
                    </div>
                    <div className="bot">
                      <Link
                        className="link"
                        href={`/work?project=${encodeURIComponent(project.slug || slugifyProjectTitle(project.title))}`}
                      >
                        {copy.homeProjectDetails} <ArrowIcon />
                      </Link>
                      <span>{project.year}</span>
                    </div>
                  </div>
                  <figure>
                    <img
                      alt={project.imageAlt || `${project.title} project preview`}
                      src={image(project.img)}
                    />
                    <div aria-label="Project services" className="project-tags">
                      {project.tagsList.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </figure>
                </article>
              ))}
              <Link className="work-all-link" href="/work">
                {copy.homeSeeAllWork} <ArrowIcon />
              </Link>
              <div aria-hidden="true" className="hold" />
            </div>
          </section>

          <section className="testi" id="testimonial">
            <div className="wrap">
              <div className="testi-head">
                <h2>{copy.homeTestimonialsTitle}</h2>
                <p className="lead">{copy.homeTestimonialsDescription}</p>
              </div>
              <div className="tcols">
                {content.testimonials.map((testimonial, index) => (
                  <div
                    className={`tcol${index % 2 ? " rev" : ""}`}
                    key={testimonial.name}
                  >
                    <div className="tq">
                      <p>{testimonial.quote}</p>
                    </div>
                    <div className="ta">
                      <img alt="" src={image(testimonial.photo)} />
                      <div>
                        <b>{testimonial.name}</b>
                        <span>{testimonial.company}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="faq" id="faq">
            <div className="wrap">
              <div className="faq-h">
                <div className="eyebrow">{copy.homeFaqEyebrow}</div>
                <h2>{copy.homeFaqTitle}</h2>
                <p className="lead">{copy.homeFaqDescription}</p>
              </div>
              <div className="acc">
                {content.faqs.map((item, index) => (
                  <div className={`qa${index === 0 ? " open" : ""}`} key={item.q}>
                    <button aria-expanded={index === 0} type="button">
                      {item.q}
                      <span className="pm" />
                    </button>
                    <div className="ans">
                      <div>
                        <p>{item.ans}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <HomepageCta settings={content.settings} />
        </main>

        <HomepageFooter settings={content.settings} />
      </div>
    </PrototypeInteractions>
  );
}
