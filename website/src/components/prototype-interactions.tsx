"use client";

import { useEffect, type ReactNode } from "react";
import { useLenisScroll } from "@/hooks/use-lenis-scroll";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function PrototypeInteractions({
  children,
  contentVersion,
}: {
  children: ReactNode;
  contentVersion: number;
}) {
  useLenisScroll();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector<HTMLElement>(".hero");
    const heroCluster = document.querySelector<HTMLElement>(".cluster");
    const clusterImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(".cluster img"),
    );
    const clusterRotations = clusterImages.map((image) => {
      const match = image.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
      return match ? Number(match[1]) : 0;
    });
    const ctaImages = Array.from(document.querySelectorAll<HTMLImageElement>(".cta .ph"));
    const trailSources = [
      ...clusterImages.map((image) => image.src),
      ...ctaImages.map((image) => image.src),
    ].filter((source, index, sources) => sources.indexOf(source) === index);

    let lastTrail = { x: -999, y: -999 };
    let trailIndex = 0;
    let trailZIndex = 3;
    const activeTrails = new Set<HTMLImageElement>();
    const activeTouchPointers = new Set<number>();
    const appendTrail = (x: number, y: number) => {
      if (!hero || trailSources.length === 0) return;
      if (activeTrails.size >= 12) {
        const oldestTrail = activeTrails.values().next().value;
        if (oldestTrail) {
          oldestTrail.remove();
          activeTrails.delete(oldestTrail);
        }
      }
      const trail = document.createElement("img");
      trail.className = "trail";
      trail.alt = "";
      trail.src = trailSources[trailIndex++ % trailSources.length];
      trail.style.left = `${x}px`;
      trail.style.top = `${y}px`;
      trail.style.zIndex = String(trailZIndex++);
      trail.style.setProperty("--r", `${(Math.random() * 18 - 9).toFixed(1)}deg`);
      hero.appendChild(trail);
      activeTrails.add(trail);
      trail.addEventListener(
        "animationend",
        () => {
          trail.remove();
          activeTrails.delete(trail);
        },
        { once: true },
      );
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        reduce ||
        event.pointerType !== "touch" ||
        !window.matchMedia("(max-width: 1100px)").matches ||
        !hero ||
        (event.target instanceof Element && event.target.closest("a, button"))
      ) {
        return;
      }
      hero.classList.add("touch-cards-active");
      activeTouchPointers.add(event.pointerId);
      const rect = hero.getBoundingClientRect();
      lastTrail = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      appendTrail(lastTrail.x, lastTrail.y);
    };
    const onPointerEnd = (event: PointerEvent) => {
      activeTouchPointers.delete(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const smallViewport = window.matchMedia("(max-width: 1100px)").matches;
      const touchGesture = event.pointerType === "touch" && smallViewport;
      const cursorGesture =
        (event.pointerType === "mouse" || event.pointerType === "pen") && !smallViewport;
      if (
        reduce ||
        (!touchGesture && !cursorGesture) ||
        !hero ||
        trailSources.length === 0
      ) {
        return;
      }
      if (touchGesture && !activeTouchPointers.has(event.pointerId)) return;
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const movementThreshold = touchGesture ? 36 : 120;
      if (Math.hypot(x - lastTrail.x, y - lastTrail.y) < movementThreshold) return;
      lastTrail = { x, y };

      appendTrail(x, y);
    };
    hero?.addEventListener("pointermove", onPointerMove);
    hero?.addEventListener("pointerdown", onPointerDown);
    hero?.addEventListener("pointerup", onPointerEnd);
    hero?.addEventListener("pointercancel", onPointerEnd);

    const rows = Array.from(document.querySelectorAll<HTMLElement>(".row"));
    const floatingCard = document.querySelector<HTMLElement>(".float");
    const serviceBackgroundImages = Array.from(
      document.querySelectorAll<HTMLElement>(".svc-background-image"),
    );
    const floatingImages = floatingCard
      ? Array.from(floatingCard.children).filter(
          (child): child is HTMLImageElement => child instanceof HTMLImageElement,
        )
      : [];
    let lastScrollServiceIndex = -1;

    const setRow = (activeIndex: number) => {
      const activeRow = rows[activeIndex];
      if (!activeRow || !floatingCard) return;

      rows.forEach((row, index) => row.classList.toggle("on", index === activeIndex));
      const mobileCardSlot = window.innerWidth <= 720;
      rows.forEach((row, index) =>
        row.classList.toggle("mobile-card-slot", mobileCardSlot && index === activeIndex),
      );
      floatingImages.forEach((image, index) =>
        image.classList.toggle("on", index === activeIndex),
      );
      serviceBackgroundImages.forEach((image) =>
        image.classList.toggle(
          "is-active",
          Number(image.dataset.serviceIndex) === activeIndex,
        ),
      );
      const title = activeRow.querySelector("h3");
      const description = activeRow.querySelector("p");
      const list = rows[0]?.parentElement;
      if (!title || !description || !list) return;
      const listRect = list.getBoundingClientRect();
      const availableWidth = Math.max(
        0,
        Math.min(
          234,
          description.getBoundingClientRect().left -
            title.getBoundingClientRect().right -
            40,
        ),
      );
      const compact = availableWidth < 120 || window.innerWidth <= 1100;
      const width = compact
        ? Math.max(96, Math.min(180, listRect.width - 32))
        : availableWidth;
      const height = (width * 259) / 234;

      floatingCard.classList.toggle("compact", compact);
      floatingCard.style.width = `${width}px`;
      floatingCard.style.height = `${height}px`;
      if (window.innerWidth <= 720) {
        floatingCard.style.left = `${(listRect.width - width) / 2}px`;
        floatingCard.style.top = `${activeRow.offsetTop + 12}px`;
        floatingCard.style.display = "";
      } else {
        floatingCard.style.left = `${(listRect.width - width) / 2 - 40}px`;
        floatingCard.style.top = `${
          activeRow.offsetTop + activeRow.offsetHeight / 2 - height / 2
        }px`;
        floatingCard.style.display = "";
      }
    };

    const onServiceInteraction = (index: number) => {
      setRow(index);
    };
    const serviceListeners = rows.map((row, index) => {
      const onEnter = () => onServiceInteraction(index);
      const onFocus = () => onServiceInteraction(index);
      const onClick = () => onServiceInteraction(index);
      row.addEventListener("mouseenter", onEnter);
      row.addEventListener("focus", onFocus);
      row.addEventListener("click", onClick);
      return () => {
        row.removeEventListener("mouseenter", onEnter);
        row.removeEventListener("focus", onFocus);
        row.removeEventListener("click", onClick);
      };
    });
    setRow(
      Math.max(
        0,
        rows.findIndex((row) => row.classList.contains("on")),
      ),
    );
    const onResize = () => {
      setRow(
        Math.max(
          0,
          rows.findIndex((row) => row.classList.contains("on")),
        ),
      );
    };
    window.addEventListener("resize", onResize);
    const refreshServiceLayout = () => onResize();
    document.fonts?.ready.then(refreshServiceLayout);

    const faqButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".qa button"),
    );
    const onFaqClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const item = button.parentElement;
      if (!item) return;
      const shouldOpen = !item.classList.contains("open");
      document.querySelectorAll<HTMLElement>(".qa").forEach((question) => {
        question.classList.remove("open");
        question.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (shouldOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    };
    faqButtons.forEach((button) => button.addEventListener("click", onFaqClick));

    const heroTitle = document.querySelector<HTMLElement>(".hero-title");
    const titleTextNode = heroTitle?.firstChild;
    if (heroTitle && titleTextNode?.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      titleTextNode.textContent?.split("").forEach((character, index) => {
        const outer = document.createElement("span");
        const inner = document.createElement("i");
        outer.className = "hc";
        outer.setAttribute("aria-hidden", "true");
        inner.style.setProperty("--d", String(index));
        inner.innerHTML = character === " " ? "&nbsp;" : character;
        outer.appendChild(inner);
        fragment.appendChild(outer);
      });
      heroTitle.setAttribute("aria-label", "Kitari Studio");
      heroTitle.replaceChild(fragment, titleTextNode);
    }

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".cat-head h2,.svc-head h2,.work-head h2,.testi-head h2,.faq-h h2,.cta h2",
      ),
    );
    headings.forEach((heading) => {
      const text = heading.textContent?.trim() ?? "";
      heading.setAttribute("aria-label", text);
      const fragment = document.createDocumentFragment();
      text.split(/\s+/).forEach((word, index) => {
        const mask = document.createElement("span");
        const inner = document.createElement("span");
        mask.className = "mw";
        mask.setAttribute("aria-hidden", "true");
        inner.className = "mi";
        inner.style.setProperty("--d", String(index));
        inner.textContent = word;
        mask.appendChild(inner);
        fragment.append(mask, document.createTextNode(" "));
      });
      heading.replaceChildren(fragment);
    });

    const aboutStatement = document.querySelector<HTMLElement>(".about .big");
    const aboutWords: HTMLElement[] = [];
    if (aboutStatement) {
      const text = aboutStatement.textContent?.trim() ?? "";
      aboutStatement.setAttribute("aria-label", text);
      const fragment = document.createDocumentFragment();
      text.split(/\s+/).forEach((word) => {
        const span = document.createElement("span");
        span.className = "w";
        span.setAttribute("aria-hidden", "true");
        span.textContent = word;
        aboutWords.push(span);
        fragment.append(span, document.createTextNode(" "));
      });
      aboutStatement.replaceChildren(fragment);
    }

    const stats = Array.from(document.querySelectorAll<HTMLElement>(".stat b")).flatMap(
      (counter) => {
        const match = counter.textContent?.match(/(\d+)(.*)/);
        if (!match) return [];
        const target = counter.dataset.target ?? match[1];
        counter.dataset.target = target;
        return [{ counter, target: Number(target), suffix: match[2] }];
      },
    );
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".cat-head h2,.svc-head h2,.work-head h2,.testi-head h2,.faq-h h2,.cta h2,.card",
      ),
    );
    const projects = Array.from(document.querySelectorAll<HTMLElement>(".proj"));
    const testimonialColumns = Array.from(
      document.querySelectorAll<HTMLElement>(".tcol"),
    );
    const heroTitleElement = document.querySelector<HTMLElement>(".hero-title");
    const tagline = document.querySelector<HTMLElement>(".tag");
    const cataloguePanel = document.querySelector<HTMLElement>(".cat");
    const aboutSection = document.querySelector<HTMLElement>(".about");
    const aboutIntro = aboutSection?.querySelector<HTMLElement>(".wrap");
    const statisticsStage = document.querySelector<HTMLElement>(".zstage");
    const statisticsPin = document.querySelector<HTMLElement>(".zpin");
    const statisticsImage = document.querySelector<HTMLElement>(".zimg");
    const statisticsPlaceholder = document.querySelector<HTMLElement>(".zph");
    const statistics = Array.from(document.querySelectorAll<HTMLElement>(".stat"));
    const servicesStage = document.querySelector<HTMLElement>(".svc-stage");
    const servicesPanel = document.querySelector<HTMLElement>(".svc");
    const callToAction = document.querySelector<HTMLElement>(".cta");
    const mobileCards = reduce ? null : gsap.matchMedia();
    const callToActionImages = Array.from(
      document.querySelectorAll<HTMLElement>(".cta .ph"),
    );
    const alignProjectBackgrounds = () => {
      projects.forEach((project) => {
        project.style.backgroundPosition = `${-project.offsetLeft}px ${-project.offsetTop}px`;
      });
    };
    ScrollTrigger.addEventListener("refresh", alignProjectBackgrounds);
    let mounted = true;
    const positionReducedStatisticsImage = () => {
      if (!statisticsPin || !statisticsImage || !statisticsPlaceholder) return;
      const pinRect = statisticsPin.getBoundingClientRect();
      const placeholderRect = statisticsPlaceholder.getBoundingClientRect();
      statisticsImage.style.left = `${placeholderRect.left - pinRect.left}px`;
      statisticsImage.style.top = `${placeholderRect.top - pinRect.top}px`;
      statisticsImage.style.width = `${placeholderRect.width}px`;
      statisticsImage.style.height = `${placeholderRect.height}px`;
      statisticsImage.style.borderRadius = "8px";
    };
    const addRubber = (stage: HTMLElement | null, panel: HTMLElement | null) => {
      const content = panel?.querySelector<HTMLElement>(":scope > .wrap");
      if (!stage || !content) return;

      gsap.set(content, { transformOrigin: "50% 0" });

      const MAX_PULL = 90;
      const K = 3.2;
      const pull = (progress: number) =>
        (MAX_PULL * (1 - Math.exp(-K * progress))) / (1 - Math.exp(-K));

      const release = () =>
        gsap.to(content, {
          y: 0,
          scaleY: 1,
          duration: 1.1,
          ease: "elastic.out(1, 0.45)",
          overwrite: true,
        });

      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const distance = pull(self.progress);
          gsap.to(content, {
            y: -distance,
            scaleY: 1 + (distance / MAX_PULL) * 0.04,
            duration: 0.5,
            ease: "power3.out",
            overwrite: true,
          });
        },
        onLeave: release,
        onLeaveBack: release,
      });
    };

    const motionContext = gsap.context(() => {
      if (reduce) {
        revealElements.forEach((element) => element.classList.add("in"));
        positionReducedStatisticsImage();
        window.addEventListener("resize", positionReducedStatisticsImage);
        document.fonts?.ready.then(() => {
          if (mounted) positionReducedStatisticsImage();
        });
        return;
      }

      revealElements.forEach((element) => {
        ScrollTrigger.create({
          trigger: element,
          start: "top 84%",
          once: true,
          onEnter: () => element.classList.add("in"),
        });
      });

      projects.slice(1).forEach((project, index) => {
        const previousProject = projects[index];
        if (!previousProject) return;

        gsap.fromTo(
          project,
          {
            backgroundColor: "rgba(20, 20, 20, 0.35)",
            backdropFilter: "blur(12px)",
          },
          {
            backgroundColor: "rgb(20, 20, 20)",
            backdropFilter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: project,
              start: () => `top ${previousProject.offsetHeight + 24}px`,
              end: "top 24px",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      stats.forEach(({ counter, target, suffix }) => {
        const value = { current: 0 };
        gsap.to(value, {
          current: target,
          duration: 1.7,
          ease: "expo.out",
          onUpdate: () => {
            counter.textContent = `${Math.round(value.current)}${suffix}`;
          },
          scrollTrigger: {
            trigger: statisticsStage ?? counter,
            start: "top 80%",
            once: true,
          },
        });
      });

      if (hero && heroTitleElement) {
        const heroMotion = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        heroMotion.to(
          heroTitleElement,
          {
            y: () => -window.innerHeight * 0.16,
            ease: "none",
          },
          0,
        );
        if (tagline) {
          heroMotion.to(
            tagline,
            {
              y: () => -window.innerHeight * 0.07,
              ease: "none",
            },
            0,
          );
        }

        mobileCards?.add("(max-width: 1100px)", () => {
          const driftX = [-180, 140, -140, 190, -170, 120];
          const driftY = [-120, 80, 160, 210, -75, 190];
          const driftRotation = [-48, 38, -34, 52, -42, 36];
          gsap.to(heroCluster, {
            y: -36,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
          gsap.to(clusterImages, {
            x: (index) => driftX[index] ?? 0,
            y: (index) => driftY[index] ?? 0,
            rotation: (index) => clusterRotations[index] + (driftRotation[index] ?? 0),
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      }

      if (aboutStatement && aboutWords.length > 0) {
        gsap.fromTo(
          aboutWords,
          { color: "rgb(88, 88, 88)" },
          {
            color: "rgb(255, 255, 255)",
            stagger: 0.035,
            ease: "none",
            scrollTrigger: {
              trigger: aboutStatement,
              start: "top 85%",
              end: "bottom 40%",
              scrub: true,
            },
          },
        );
      }

      if (aboutSection && aboutIntro) {
        gsap.fromTo(
          aboutIntro,
          { y: 64 },
          {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: aboutSection,
              start: "top bottom",
              end: "top 35%",
              scrub: true,
            },
          },
        );
      }

      if (cataloguePanel && aboutSection) {
        gsap.fromTo(
          cataloguePanel,
          { filter: "blur(0px)" },
          {
            filter: "blur(10px)",
            ease: "none",
            scrollTrigger: {
              trigger: aboutSection,
              start: "top 50%",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: ({ progress }) =>
                cataloguePanel.classList.toggle("is-covered", progress >= 0.995),
              onLeaveBack: () => cataloguePanel.classList.remove("is-covered"),
            },
          },
        );
      }

      if (statisticsStage && statisticsPin && statisticsImage && statisticsPlaceholder) {
        gsap.set(statisticsImage, { transformOrigin: "top left" });
        const statisticsMotion = gsap.timeline({
          scrollTrigger: {
            trigger: aboutSection ?? statisticsStage,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.1}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        statisticsMotion.fromTo(
          statisticsImage,
          {
            x: () => {
              const pinRect = statisticsPin.getBoundingClientRect();
              const imageRect = statisticsPlaceholder.getBoundingClientRect();
              return imageRect.left - pinRect.left;
            },
            y: () => {
              const pinRect = statisticsPin.getBoundingClientRect();
              const imageRect = statisticsPlaceholder.getBoundingClientRect();
              return imageRect.top - pinRect.top;
            },
            width: () => statisticsPlaceholder.getBoundingClientRect().width,
            height: () => statisticsPlaceholder.getBoundingClientRect().height,
            borderRadius: 8,
          },
          {
            x: 0,
            y: 0,
            width: () => statisticsPin.clientWidth,
            height: () => statisticsPin.clientHeight,
            borderRadius: 0,
            ease: "none",
            duration: 0.6,
          },
        );
        statisticsMotion.to(
          statistics,
          {
            opacity: 0,
            x: (index) => (index < 2 ? -140 : 140),
            ease: "none",
            stagger: 0,
            duration: 0.25,
          },
          0.35,
        );
      }

      if (servicesStage && servicesPanel && window.innerWidth > 1100) {
        ScrollTrigger.create({
          trigger: servicesStage,
          start: "top top",
          end: "bottom top",
          onToggle: ({ isActive }) =>
            servicesPanel.classList.toggle("is-fullscreen", isActive),
        });
        ScrollTrigger.create({
          trigger: servicesStage,
          start: "top bottom",
          end: "bottom top",
          onToggle: ({ isActive }) =>
            statisticsImage?.classList.toggle("is-background-blurred", isActive),
        });
      }

      if (servicesStage && rows.length > 1) {
        ScrollTrigger.create({
          trigger: servicesStage,
          start: "top top",
          end: "bottom bottom",
          onUpdate: ({ progress }) => {
            const lastIndex = rows.length - 1;
            const nextIndex = Math.min(lastIndex, Math.floor(progress * rows.length));
            if (nextIndex !== lastScrollServiceIndex) {
              lastScrollServiceIndex = nextIndex;
              setRow(nextIndex);
            }
          },
          onLeaveBack: () => {
            lastScrollServiceIndex = 0;
            setRow(0);
          },
          onLeave: () => {
            lastScrollServiceIndex = rows.length - 1;
            setRow(rows.length - 1);
          },
        });
      }

      if (window.innerWidth > 1100) {
        addRubber(document.querySelector<HTMLElement>(".cat-stage"), cataloguePanel);
        addRubber(servicesStage, servicesPanel);
      }

      testimonialColumns.forEach((column, index) => {
        gsap.fromTo(
          column,
          { y: index % 2 ? 85 : -85 },
          {
            y: index % 2 ? -85 : 85,
            ease: "none",
            scrollTrigger: {
              trigger: column.closest(".testi"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      if (callToAction && callToActionImages.length > 0) {
        const rotations = [-6, 5, -4, 7];
        const yDrifts = [-420, 320, -260, 380];
        const rotationDrifts = [40, -40, 60, -60];
        const gatherOffsetX = [-4, 3, -2, 4];
        const gatherOffsetY = [-3, 4, 3, -4];
        const ctaMotion = gsap.timeline({
          scrollTrigger: {
            trigger: callToAction,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        ctaMotion.fromTo(
          callToActionImages,
          {
            x: (index) => {
              const image = callToActionImages[index];
              const slot = index % 4;
              return (
                callToAction.offsetWidth / 2 -
                image.offsetLeft -
                image.offsetWidth / 2 +
                gatherOffsetX[slot]
              );
            },
            y: (index) => {
              const image = callToActionImages[index];
              const slot = index % 4;
              return (
                callToAction.offsetHeight / 2 -
                image.offsetTop -
                image.offsetHeight / 2 +
                gatherOffsetY[slot]
              );
            },
            rotation: 0,
            scale: 0.82,
            opacity: 0.28,
          },
          {
            x: 0,
            y: 0,
            rotation: (index) => rotations[index % 4],
            scale: 1,
            opacity: 1,
            ease: "none",
            duration: 0.55,
          },
          0,
        );
        ctaMotion.to(
          callToActionImages,
          {
            y: (index) => yDrifts[index % 4],
            rotation: (index) => rotations[index % 4] + rotationDrifts[index % 4],
            ease: "none",
            duration: 0.45,
          },
          0.55,
        );
      }
    });

    alignProjectBackgrounds();
    document.fonts?.ready.then(() => {
      if (mounted) ScrollTrigger.refresh();
    });

    return () => {
      mounted = false;
      root.classList.remove("js");
      cataloguePanel?.classList.remove("is-covered");
      statisticsImage?.classList.remove("is-background-blurred");
      activeTrails.forEach((trail) => trail.remove());
      activeTrails.clear();
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerdown", onPointerDown);
      hero?.removeEventListener("pointerup", onPointerEnd);
      hero?.removeEventListener("pointercancel", onPointerEnd);
      serviceListeners.forEach((remove) => remove());
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", positionReducedStatisticsImage);
      faqButtons.forEach((button) => button.removeEventListener("click", onFaqClick));
      motionContext.revert();
      mobileCards?.revert();
      ScrollTrigger.removeEventListener("refresh", alignProjectBackgrounds);
    };
  }, [contentVersion]);

  return children;
}
