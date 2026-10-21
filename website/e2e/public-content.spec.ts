import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { expect, test } from "@playwright/test";
import { getLocalAdminApp } from "../scripts/admin-app";
import { siteSettings } from "../src/data/site-content";

test.describe.configure({ mode: "serial" });

const db = getFirestore(getLocalAdminApp());
const settingsRef = db.collection("siteSettings").doc("main");
const fixtureIds = {
  catalogue: "e2e-dynamic-catalogue",
  services: "e2e-dynamic-service",
  serviceBackground: "e2e-dynamic-service-background",
  projects: "e2e-dynamic-project",
  testimonials: "e2e-dynamic-testimonial",
  faqs: "e2e-dynamic-faq",
};
let previousSettings: DocumentData | undefined;

test.beforeEach(async () => {
  previousSettings = (await settingsRef.get()).data();
});

test.afterEach(async () => {
  const batch = db.batch();
  for (const [collectionName, id] of Object.entries(fixtureIds)) {
    batch.delete(db.collection(collectionName).doc(id));
  }
  batch.delete(db.collection("catalogue").doc("e2e-draft-catalogue"));
  if (previousSettings) {
    batch.set(settingsRef, previousSettings);
  } else {
    batch.delete(settingsRef);
  }
  await batch.commit();
  previousSettings = undefined;
});

test("published Firestore content replaces fallbacks and drafts stay hidden", async ({
  page,
}) => {
  const batch = db.batch();
  batch.set(settingsRef, {
    ...siteSettings,
    title: "Dynamic Kitari Studio",
    heroTagline: "Dynamic brand and digital experiences.",
    instagramUrl: "https://instagram.com/kitari",
    aboutStat1Value: "8+",
    aboutStat1Label: "Years building digital products",
  });
  batch.set(db.collection("catalogue").doc(fixtureIds.catalogue), {
    name: "Dynamic Landing Package",
    price: "$999",
    img: "/images/rectangle-25.png",
    status: "Published",
    order: 1,
  });
  batch.set(db.collection("catalogue").doc("e2e-draft-catalogue"), {
    name: "Hidden Draft Package",
    price: "$1",
    img: "/images/rectangle-25.png",
    status: "Draft",
    order: 0,
  });
  batch.set(db.collection("services").doc(fixtureIds.services), {
    name: "Dynamic Strategy",
    desc: "A service updated from the admin panel.",
    img: "/images/rectangle-25.png",
    background: siteSettings.heroCard10,
    status: "Published",
    order: 1,
  });
  batch.set(db.collection("services").doc(fixtureIds.serviceBackground), {
    name: "Dynamic Dashboard",
    desc: "A dashboard service with its own section background.",
    img: siteSettings.heroCard8,
    background: siteSettings.heroCard9,
    status: "Published",
    order: 2,
  });
  batch.set(db.collection("projects").doc(fixtureIds.projects), {
    title: "Dynamic Project",
    slug: "dynamic-project",
    country: "Indonesia",
    year: "2026",
    tagsList: ["Branding"],
    desc: "A published project from Firestore.",
    img: "/images/rectangle-25.png",
    imageAlt: "Dynamic project preview",
    client: "Dynamic Client Co.",
    clientComment: "The new experience makes everyday work simpler.",
    overview: "An overview managed in the project editor.",
    challenge: "A complex project challenge.",
    solution: "A thoughtful project solution.",
    outcome: "A successful project outcome.",
    featured: true,
    stage: "Coming soon",
    gallery: ["/images/rectangle-26.png"],
    status: "Published",
    order: 1,
  });
  batch.set(db.collection("testimonials").doc(fixtureIds.testimonials), {
    name: "Dynamic Client",
    company: "Kitari Partner",
    quote: "A testimonial managed through the admin panel.",
    photo: "/images/rectangle-25.png",
    status: "Published",
    order: 1,
  });
  batch.set(db.collection("faqs").doc(fixtureIds.faqs), {
    q: "Can I update published content?",
    ans: "Yes, changes load from Firestore on the next visit.",
    status: "Published",
    order: 1,
  });
  await batch.commit();

  await page.goto("/");
  await expect(page).toHaveTitle("Dynamic Kitari Studio");
  await expect(page.locator(".tag")).toHaveText("Dynamic brand and digital experiences.");
  await expect(page.locator(".stat").first()).toContainText(
    "8+Years building digital products",
  );
  await expect(page.locator(".card .meta").first()).toContainText(
    "Dynamic Landing Package",
  );
  await expect(page.getByText("Hidden Draft Package")).toHaveCount(0);
  await expect(page.locator(".row h3").first()).toHaveText("Dynamic Strategy");
  await expect(page.locator(".svc-background-image.is-active")).toHaveCount(0);
  await page.locator(".svc-stage").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const firstRow = document.querySelectorAll<HTMLElement>(".row")[0];
    window.scrollTo(0, firstRow.getBoundingClientRect().top + window.scrollY);
  });
  await page.evaluate(() => {
    const stage = document.querySelector(".svc-stage")!;
    window.scrollTo(
      0,
      stage.getBoundingClientRect().top +
        window.scrollY +
        stage.clientHeight -
        window.innerHeight,
    );
  });
  await expect(page.locator(".row.on h3")).toHaveText("Dynamic Dashboard");
  await page.evaluate(() => {
    const firstRow = document.querySelectorAll<HTMLElement>(".row")[0];
    window.scrollTo(0, firstRow.getBoundingClientRect().top + window.scrollY);
  });
  await expect(page.locator(".row.on h3")).toHaveText("Dynamic Strategy");
  await page.locator(".row").nth(1).click();
  await expect(page.locator(".svc-background-image.is-active")).toHaveAttribute(
    "data-service-index",
    "1",
  );
  await expect(page.locator(".svc-background-image.is-active")).toHaveAttribute(
    "src",
    siteSettings.heroCard9,
  );
  await page.locator(".row").nth(1).hover();
  await expect(page.locator(".svc-background-image.is-active")).toHaveAttribute(
    "data-service-index",
    "1",
  );
  await page.locator(".row").nth(1).click();
  await page.locator(".row").first().click();
  await expect(page.locator(".svc-background-image.is-active")).toHaveCount(0);
  await expect(page.locator(".proj .top div").first()).toContainText("Dynamic Project");
  await expect(page.getByRole("link", { name: "SEE ALL WORK" })).toHaveAttribute(
    "href",
    "/work",
  );
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "Dynamic Project" })).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project pages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goto("/work?project=dynamic-project");
  await expect(page.getByRole("heading", { name: "Dynamic Project" })).toBeVisible();
  await expect(page).toHaveTitle("Dynamic Project | Kitari Studio");
  await expect(page.getByText("A complex project challenge.")).toBeVisible();
  await expect(page.getByText("A thoughtful project solution.")).toBeVisible();
  await expect(page.getByText("Dynamic Client Co.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("The new experience makes everyday work simpler."),
  ).toBeVisible();
  await expect(page.locator(".project-detail-gallery img")).toHaveCount(1);
  await expect(page.locator(".project-detail-placeholder")).toHaveCount(2);
  await page.getByRole("link", { name: /All Project/ }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole("heading", { name: "Our Work" })).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".ta").first()).toContainText("Dynamic Client");
  await expect(
    page.getByRole("button", { name: "Can I update published content?" }),
  ).toBeVisible();
  await expect(page.locator(".soc a[aria-label=Instagram]")).toHaveAttribute(
    "href",
    "https://instagram.com/kitari",
  );
  await expect(
    page
      .locator(".fcols .fc")
      .filter({ has: page.getByRole("heading", { name: "RECENT WORKS" }) })
      .getByRole("link"),
  ).toHaveText(["Contractor", "Amiya Rosa", "Glorius Studio", "Shaistanaya City"]);
  await expect(page.getByRole("link", { name: "+62 895 1284 2356" })).toHaveAttribute(
    "href",
    "tel:+6289512842356",
  );
  const footerColumnPositions = await page.evaluate(() => {
    const x = (selector: string) =>
      Math.round(document.querySelector(selector)!.getBoundingClientRect().left);
    return {
      pages: x(".footer-pages h5"),
      inquiry: x(".footer-inquiry h5"),
      location: x(".footer-location h5"),
      openPosition: x(".footer-open-position h5"),
    };
  });
  expect(footerColumnPositions.inquiry).toBe(footerColumnPositions.pages);
  expect(footerColumnPositions.openPosition).toBe(footerColumnPositions.location);
  await expect(page.locator(".footer-open-position span").first()).toHaveCSS(
    "white-space",
    "nowrap",
  );
  const newsletterWidths = await page.evaluate(() => ({
    form: Math.round(document.querySelector(".news form")!.getBoundingClientRect().width),
    description: Math.round(
      document.querySelector(".f1 p")!.getBoundingClientRect().width,
    ),
  }));
  expect(newsletterWidths.form).toBe(newsletterWidths.description);
  const copyrightCentering = await page.locator(".copy").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.round(bounds.left + bounds.width / 2);
  });
  expect(copyrightCentering).toBe(640);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.locator(".copy").evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return Math.round(bounds.left + bounds.width / 2);
      }),
    )
    .toBe(195);
});

test("the public site keeps local fallback content when Firestore is unavailable", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:8080/**", (route) => route.abort());
  await page.goto("/");

  await expect(page.locator(".card .meta").first()).toContainText("Landing Page Website");
  await expect(page.locator(".about .big")).toContainText("Kitari Studio");
});

test("SEO metadata, structured data, sitemap, and robots are available", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const homepageCanonical = new URL(
    (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "",
  );
  expect(homepageCanonical.origin).toBe("https://kitaristudios.web.app");
  expect(homepageCanonical.pathname).toBe("/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const organizationJsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(organizationJsonLd).toContain('"@type":"Organization"');

  const [sitemap, robots] = await Promise.all([
    request.get("/sitemap.xml"),
    request.get("/robots.txt"),
  ]);
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("https://kitaristudios.web.app/contact");
  expect(await sitemap.text()).toContain("https://kitaristudios.web.app/work");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin");
  expect(robotsText).toContain("Sitemap: https://kitaristudios.web.app/sitemap.xml");

  await page.goto("/contact");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://kitaristudios.web.app/contact",
  );
});

test("global text scale updates public site typography", async ({ page }) => {
  await page.goto("/work");
  const heading = page.locator(".portfolio-content h1");
  const initialSize = await heading.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--site-text-scale", "1.1"),
  );
  const scaledSize = await heading.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );

  expect(scaledSize).toBeCloseTo(initialSize * 1.1, 1);
});

test("typography role scales update only their public text groups", async ({ page }) => {
  await page.goto("/");
  const groups = [
    { selector: ".hero-title", variable: "--site-heading-scale" },
    { selector: ".tag", variable: "--site-body-scale" },
    { selector: ".brand", variable: "--site-nav-scale" },
    { selector: ".pill", variable: "--site-button-scale" },
  ];

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const text = page.locator(group.selector).first();
    const peer = page.locator(groups[(index + 1) % groups.length].selector).first();
    const initialSize = await text.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    const peerInitialSize = await peer.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    await page.evaluate(
      ({ variable }) => document.documentElement.style.setProperty(variable, "1.2"),
      group,
    );
    const scaledSize = await text.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    const peerScaledSize = await peer.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );

    expect(scaledSize).toBeCloseTo(initialSize * 1.2, 1);
    expect(peerScaledSize).toBeCloseTo(peerInitialSize, 1);
    await page.evaluate(
      ({ variable }) => document.documentElement.style.removeProperty(variable),
      group,
    );
  }
});
