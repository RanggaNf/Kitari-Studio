import { expect, test } from "@playwright/test";

test("public sections stay in PRD order without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator(".hero")).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/lenis/);

  const sectionsAreOrdered = await page.evaluate(() => {
    const ids = [
      "home",
      "catalogue",
      "about",
      "services",
      "work",
      "testimonial",
      "faq",
      "contact-cta",
    ];
    const sections = ids.map((id) => document.getElementById(id));

    return (
      sections.every((section) => section !== null) &&
      sections.every(
        (section, index) =>
          index === sections.length - 1 ||
          Boolean(
            section!.compareDocumentPosition(sections[index + 1]!) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
      )
    );
  });

  expect(sectionsAreOrdered).toBe(true);
  expect(errors).toEqual([]);
});

test("stacked work cards stay at full brightness as the next card enters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const nextProjectTop = await page
    .locator(".proj")
    .nth(1)
    .evaluate((project) => project.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(({ top, offset }) => window.scrollTo(0, top - offset), {
    top: nextProjectTop,
    offset: 400,
  });

  await expect
    .poll(() =>
      page
        .locator(".proj")
        .first()
        .evaluate((project) => getComputedStyle(project).filter),
    )
    .toBe("none");
  await expect(page.locator(".proj").first()).toHaveCSS("position", "sticky");
});

test("See All Work sits below the last project card", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const seeAllWork = page.getByRole("link", { name: "SEE ALL WORK" });
  await seeAllWork.scrollIntoViewIfNeeded();
  await expect(seeAllWork).toBeVisible();

  const layout = await seeAllWork.evaluate((link) => {
    const bounds = link.getBoundingClientRect();
    const lastProject = document.querySelector(".proj:last-of-type");
    if (!lastProject) {
      throw new Error("The featured project list is empty.");
    }
    const projectBounds = lastProject.getBoundingClientRect();
    const elementAtCenter = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return {
      isBelowLastProject: bounds.top >= projectBounds.bottom,
      isClickable: elementAtCenter === link || link.contains(elementAtCenter),
    };
  });

  expect(layout.isBelowLastProject).toBe(true);
  expect(layout.isClickable).toBe(true);
  await expect(seeAllWork).toHaveCSS("margin-top", "20px");
});

test("homepage service, work, and testimonial descriptions use 16px base text", async ({
  page,
}) => {
  await page.goto("/");
  for (const selector of [
    ".svc-head .lead",
    ".row p",
    ".work-head .lead",
    ".testi-head .lead",
  ]) {
    const description = page.locator(selector).first();
    await expect(description).toHaveCSS("font-size", "16px");
  }
});

test("project card blur clears as the next card fully covers it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const transitionRange = await page
    .locator(".proj")
    .nth(1)
    .evaluate((project) => {
      const projectTop = project.getBoundingClientRect().top + window.scrollY;
      const projects = Array.from(document.querySelectorAll(".proj"));
      const previousHeight =
        projects[projects.indexOf(project) - 1].getBoundingClientRect().height;
      const transitionStart = projectTop - previousHeight - 24;
      const transitionEnd = projectTop - 24;
      return { transitionStart, transitionEnd };
    });
  const transitionScrollY =
    (transitionRange.transitionStart + transitionRange.transitionEnd) / 2;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, transitionScrollY);
  await page.waitForFunction(
    (top) => Math.abs(window.scrollY - top) < 1,
    transitionScrollY,
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  const transitionalStyle = await page
    .locator(".proj")
    .nth(1)
    .evaluate((project) => {
      const background = getComputedStyle(project).backgroundColor;
      return {
        backdropFilter: getComputedStyle(project).backdropFilter,
        backgroundAlpha: Number(background.match(/,\s*([\d.]+)\)$/)?.[1]),
      };
    });
  expect(transitionalStyle.backdropFilter).toContain("blur(");
  expect(transitionalStyle.backdropFilter).not.toBe("blur(0px)");
  expect(transitionalStyle.backgroundAlpha).toBeGreaterThan(0.35);
  expect(transitionalStyle.backgroundAlpha).toBeLessThan(1);

  const settledScrollY = transitionRange.transitionEnd + 2;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, settledScrollY);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, settledScrollY);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  const settledStyle = await page
    .locator(".proj")
    .nth(1)
    .evaluate((project) => ({
      backdropFilter: getComputedStyle(project).backdropFilter,
      backgroundColor: getComputedStyle(project).backgroundColor,
    }));
  expect(settledStyle.backdropFilter).toBe("blur(0px)");
  expect(settledStyle.backgroundColor).toBe("rgb(20, 20, 20)");
});

test("About stacks over the catalogue while the catalogue blurs and clears", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const range = await page.evaluate(() => {
    const catalogue = document.querySelector<HTMLElement>(".cat")!;
    const about = document.querySelector<HTMLElement>(".about")!;
    const aboutTop = about.getBoundingClientRect().top + window.scrollY;
    const catalogueStageTop =
      document.querySelector<HTMLElement>(".cat-stage")!.getBoundingClientRect().top +
      window.scrollY;
    return {
      cataloguePosition: getComputedStyle(catalogue).position,
      catalogueHeight: catalogue.getBoundingClientRect().height,
      catalogueZIndex: Number(getComputedStyle(catalogue).zIndex),
      aboutZIndex: Number(getComputedStyle(about).zIndex),
      start: aboutTop - window.innerHeight,
      end: aboutTop,
      readingHold: aboutTop - window.innerHeight - catalogueStageTop,
      catalogueStageTop,
      viewportHeight: window.innerHeight,
    };
  });

  expect(range.cataloguePosition).toBe("sticky");
  expect(range.catalogueHeight).toBe(800);
  expect(range.aboutZIndex).toBeGreaterThan(range.catalogueZIndex);
  expect(range.readingHold).toBeGreaterThanOrEqual(range.viewportHeight - 2);

  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    range.catalogueStageTop + range.viewportHeight / 2,
  );
  await expect
    .poll(() =>
      page.locator(".cat").evaluate((catalogue) => ({
        top: catalogue.getBoundingClientRect().top,
        bottom: catalogue.getBoundingClientRect().bottom,
        blur: Number(
          getComputedStyle(catalogue).filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0,
        ),
      })),
    )
    .toEqual({ top: 0, bottom: 800, blur: 0 });
  await expect
    .poll(() =>
      page.locator(".about").evaluate((about) => about.getBoundingClientRect().top),
    )
    .toBeGreaterThan(800);

  const quarterCoverScrollY = range.start + range.viewportHeight * 0.25;
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    quarterCoverScrollY,
  );
  await expect
    .poll(() =>
      page
        .locator(".cat")
        .evaluate((catalogue) =>
          Number(
            getComputedStyle(catalogue).filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0,
          ),
        ),
    )
    .toBe(0);

  const halfCoverScrollY = range.start + range.viewportHeight * 0.5;
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    halfCoverScrollY,
  );
  await expect
    .poll(() =>
      page
        .locator(".about")
        .evaluate((about) =>
          Math.abs(about.getBoundingClientRect().top - window.innerHeight / 2),
        ),
    )
    .toBeLessThan(2);
  await expect
    .poll(() =>
      page
        .locator(".cat")
        .evaluate((catalogue) =>
          Number(
            getComputedStyle(catalogue).filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0,
          ),
        ),
    )
    .toBe(0);

  const transitionScrollY = range.start + range.viewportHeight * 0.75;
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    transitionScrollY,
  );
  await expect
    .poll(() =>
      page.locator(".cat").evaluate((catalogue) => ({
        top: catalogue.getBoundingClientRect().top,
        bottom: catalogue.getBoundingClientRect().bottom,
      })),
    )
    .toEqual({ top: 0, bottom: 800 });
  await expect
    .poll(() =>
      page.locator(".about").evaluate((about) => about.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(() =>
      page.locator(".about").evaluate((about) => about.getBoundingClientRect().top),
    )
    .toBeLessThan(800);
  await expect
    .poll(() =>
      page
        .locator(".cat")
        .evaluate((catalogue) =>
          Number(
            getComputedStyle(catalogue).filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0,
          ),
        ),
    )
    .toBeGreaterThan(0);

  const transitionalStyle = await page.locator(".cat").evaluate((catalogue) => ({
    filter: getComputedStyle(catalogue).filter,
    transform: getComputedStyle(catalogue).transform,
  }));
  expect(transitionalStyle.filter).toContain("blur(");
  expect(transitionalStyle.filter).not.toBe("blur(0px)");
  expect(transitionalStyle.transform).toBe("none");

  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    range.end + 2,
  );
  await expect
    .poll(() => page.evaluate((top) => Math.abs(window.scrollY - top), range.end + 2))
    .toBeLessThan(1);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".about")).toHaveCSS("z-index", "2");
  await expect(page.locator(".cat")).toHaveCSS("visibility", "hidden");

  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    range.start + 2,
  );
  await expect
    .poll(() => page.evaluate((top) => Math.abs(window.scrollY - top), range.start + 2))
    .toBeLessThan(1);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".cat")).toHaveCSS("visibility", "visible");
});

test("hero, About overlap, project cards, and CTA use the requested layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const desktopLayout = await page.evaluate(() => {
    const hero = document.querySelector(".hero")!.getBoundingClientRect();
    const tagline = document.querySelector(".tag")!.getBoundingClientRect();
    const catalogue = document.querySelector(".cat")!.getBoundingClientRect();
    const catalogueStage = document.querySelector(".cat-stage")!.getBoundingClientRect();
    const about = document.querySelector(".about")!;
    const aboutBounds = about.getBoundingClientRect();
    const aboutText = about.querySelector(".big")!;
    const aboutButton = about.querySelector(".pill")!;
    const project = document.querySelector(".proj")!;
    const cta = document.querySelector(".cta")!;
    return {
      heroCenterDifference: Math.abs(
        tagline.top + tagline.height / 2 - (hero.top + hero.height / 2),
      ),
      taglineRight: tagline.right,
      catalogueOverlap: catalogue.bottom - aboutBounds.top,
      catalogueStageHeight: catalogueStage.height,
      aboutOverlayDistance: catalogueStage.bottom - aboutBounds.top,
      catalogueZIndex: getComputedStyle(document.querySelector(".cat")!).zIndex,
      aboutZIndex: getComputedStyle(about).zIndex,
      aboutTextBottomMargin: getComputedStyle(aboutText).marginBottom,
      aboutButtonGap:
        aboutButton.getBoundingClientRect().top -
        aboutText.getBoundingClientRect().bottom,
      projectBorderWidth: getComputedStyle(project).borderTopWidth,
      projectBorderRadius: getComputedStyle(project).borderTopLeftRadius,
      projectBackdropFilter: getComputedStyle(project).backdropFilter,
      projectBackground: getComputedStyle(project).backgroundColor,
      ctaMinHeight: parseFloat(getComputedStyle(cta).minHeight),
      ctaBackgroundSize: getComputedStyle(cta).backgroundSize,
      viewportHeight: window.innerHeight,
    };
  });

  expect(desktopLayout.heroCenterDifference).toBeLessThan(2);
  expect(desktopLayout.taglineRight).toBeLessThanOrEqual(1280);
  expect(desktopLayout.catalogueOverlap).toBeCloseTo(-desktopLayout.viewportHeight, 0);
  expect(desktopLayout.catalogueStageHeight).toBeGreaterThanOrEqual(
    desktopLayout.viewportHeight * 3 - 2,
  );
  expect(desktopLayout.aboutOverlayDistance).toBeGreaterThanOrEqual(
    desktopLayout.viewportHeight - 2,
  );
  expect(Number(desktopLayout.aboutZIndex)).toBeGreaterThan(
    Number(desktopLayout.catalogueZIndex),
  );
  expect(desktopLayout.aboutTextBottomMargin).toBe("12px");
  expect(desktopLayout.aboutButtonGap).toBeGreaterThanOrEqual(20);
  expect(desktopLayout.projectBorderWidth).toBe("1px");
  expect(desktopLayout.projectBorderRadius).toBe("16px");
  expect(desktopLayout.projectBackdropFilter).toBe("none");
  expect(desktopLayout.projectBackground).toBe("rgb(20, 20, 20)");
  expect(desktopLayout.ctaMinHeight).toBeGreaterThanOrEqual(desktopLayout.viewportHeight);
  expect(desktopLayout.ctaBackgroundSize).toBe("cover");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".svc-bg img").first()).toBeAttached();
  const mobileLayout = await page.evaluate(() => ({
    taglineRight: document.querySelector(".tag")!.getBoundingClientRect().right,
    serviceBackgroundPosition: getComputedStyle(document.querySelector(".svc-bg img")!)
      .objectPosition,
    cataloguePosition: getComputedStyle(document.querySelector(".cat")!).position,
    catalogueHeight: document.querySelector(".cat")!.getBoundingClientRect().height,
    catalogueStageHeight: document.querySelector(".cat-stage")!.getBoundingClientRect()
      .height,
  }));
  expect(mobileLayout.taglineRight).toBeLessThanOrEqual(390);
  expect(mobileLayout.serviceBackgroundPosition).toBe("50% 50%");
  expect(mobileLayout.cataloguePosition).toBe("relative");
  expect(mobileLayout.catalogueStageHeight).toBeCloseTo(mobileLayout.catalogueHeight, 0);
});

test("reduced motion keeps content visible and disables smooth scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator(".cat-head h2")).toHaveClass(/in/);
  await expect(page.locator(".cat-head h2 .mi").first()).toBeVisible();
  await expect(page.locator(".card").first()).toHaveClass(/in/);

  const imageAlignment = await page.evaluate(() => {
    const image = document.querySelector(".zimg")!.getBoundingClientRect();
    const placeholder = document.querySelector(".zph")!.getBoundingClientRect();
    return {
      left: Math.abs(image.left - placeholder.left),
      top: Math.abs(image.top - placeholder.top),
      width: Math.abs(image.width - placeholder.width),
      height: Math.abs(image.height - placeholder.height),
    };
  });
  expect(imageAlignment.left).toBeLessThan(2);
  expect(imageAlignment.top).toBeLessThan(2);
  expect(imageAlignment.width).toBeLessThan(2);
  expect(imageAlignment.height).toBeLessThan(2);
});

test("about image starts at its placeholder size and expands to fill the pinned viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const aboutStageTop = await page
    .locator(".zstage")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const initialScrollY = aboutStageTop + 2;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, initialScrollY);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, initialScrollY);
  const buttonToImageGap = await page.evaluate(() => {
    const button = document.querySelector(".about .pill")!.getBoundingClientRect();
    const image = document.querySelector(".zimg")!.getBoundingClientRect();
    return image.top - button.bottom;
  });
  expect(buttonToImageGap).toBeGreaterThanOrEqual(45);
  await expect
    .poll(async () =>
      page.locator(".zimg").evaluate((image) => {
        const imageRect = image.getBoundingClientRect();
        const placeholderRect = document.querySelector(".zph")!.getBoundingClientRect();
        return Math.max(
          Math.abs(imageRect.left - placeholderRect.left),
          Math.abs(imageRect.top - placeholderRect.top),
          Math.abs(imageRect.width - placeholderRect.width),
          Math.abs(imageRect.height - placeholderRect.height),
        );
      }),
    )
    .toBeLessThan(3);
  const startBounds = await page.locator(".zimg").evaluate((image) => {
    const imageRect = image.getBoundingClientRect();
    const placeholderRect = document.querySelector(".zph")!.getBoundingClientRect();
    return {
      left: Math.abs(imageRect.left - placeholderRect.left),
      top: Math.abs(imageRect.top - placeholderRect.top),
      width: Math.abs(imageRect.width - placeholderRect.width),
      height: Math.abs(imageRect.height - placeholderRect.height),
      placeholderCenterY: placeholderRect.top + placeholderRect.height / 2,
      viewportHeight: window.innerHeight,
    };
  });
  expect(startBounds.left).toBeLessThan(3);
  expect(startBounds.top).toBeLessThan(3);
  expect(startBounds.width).toBeLessThan(3);
  expect(startBounds.height).toBeLessThan(3);
  expect(startBounds.placeholderCenterY).toBeLessThan(startBounds.viewportHeight * 0.2);

  const finalScrollY = aboutStageTop + 960;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, finalScrollY);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, finalScrollY);
  const finalBounds = await page.locator(".zimg").evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
    };
  });
  expect(finalBounds.width).toBeGreaterThan(finalBounds.viewportWidth * 0.98);
  expect(finalBounds.height).toBeGreaterThan(finalBounds.viewportHeight * 0.98);
});

test("about image zooms and crops instead of stretching on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const aboutStageTop = await page
    .locator(".zstage")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const targetScrollY = aboutStageTop + 1013;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, targetScrollY);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, targetScrollY);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  await expect
    .poll(() =>
      page.locator(".zimg").evaluate((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width / rect.height;
      }),
    )
    .toBeCloseTo(335 / 200, 2);
  const finalBounds = await page.locator(".zimg").evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(finalBounds.left).toBeLessThan(0);
  expect(finalBounds.right).toBeGreaterThan(finalBounds.viewportWidth);
  expect(finalBounds.height).toBeGreaterThan(finalBounds.viewportHeight * 0.98);
  expect(finalBounds.width).toBeGreaterThan(finalBounds.viewportWidth);
});

test("About statistics count up to their original values", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const statisticsTop = await page
    .locator(".zstage")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, statisticsTop + 300);

  await expect(page.locator(".stat b")).toHaveText(["5+", "40+", "30+", "10+"]);
});

test("services content stays vertically centered in a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto("/");

  const stageTop = await page
    .locator(".svc-stage")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const targetScrollY = stageTop + 200;
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, targetScrollY);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, targetScrollY);

  await expect
    .poll(() =>
      page.locator(".svc").evaluate((section) => {
        const sectionBounds = section.getBoundingClientRect();
        const contentBounds = section.querySelector(".wrap")!.getBoundingClientRect();
        return Math.abs(
          contentBounds.top +
            contentBounds.height / 2 -
            (sectionBounds.top + sectionBounds.height / 2),
        );
      }),
    )
    .toBeLessThan(4);
});
