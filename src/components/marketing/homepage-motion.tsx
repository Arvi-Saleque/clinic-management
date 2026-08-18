"use client";

import * as React from "react";

/**
 * Homepage-only motion orchestrator.
 *
 * Scope is intentionally limited to `.luxury-homepage-root` plus the homepage
 * header buttons. It mounts Lenis only while the homepage is mounted and
 * cleans up all GSAP timelines/ScrollTriggers on unmount.
 */
export function HomepageMotion() {
  React.useEffect(() => {
    let cancelled = false;
    let dispose = () => {};

    const setup = async () => {
      const [gsapModule, scrollTriggerModule, splitTextModule, drawSvgModule, morphSvgModule, lenisModule] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("gsap/SplitText"),
          import("gsap/DrawSVGPlugin"),
          import("gsap/MorphSVGPlugin"),
          import("lenis"),
        ]);

      if (cancelled) return;

      const { gsap } = gsapModule;
      const { ScrollTrigger } = scrollTriggerModule;
      const { SplitText } = splitTextModule;
      const { DrawSVGPlugin } = drawSvgModule;
      const { MorphSVGPlugin } = morphSvgModule;
      const Lenis = lenisModule.default;

      gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin);

      const root = document.querySelector<HTMLElement>(".luxury-homepage-root");
      if (!root) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const desktop = window.matchMedia("(min-width: 1025px)").matches;

      document.documentElement.classList.add("homepage-motion-enabled");
      if (reducedMotion) {
        document.documentElement.classList.add("homepage-motion-reduced");
        dispose = () => {
          document.documentElement.classList.remove("homepage-motion-enabled", "homepage-motion-reduced");
        };
        return;
      }

      // Lenis is homepage-only so the internal staff/patient apps keep native scrolling.
      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        syncTouch: false,
        anchors: { offset: -96 },
        stopInertiaOnNavigate: true,
        respectReducedMotion: true,
      });

      const onLenisScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onLenisScroll);
      const ticker = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      const eventCleanups: Array<() => void> = [];
      const delayedCalls: Array<{ kill: () => void }> = [];

      const ctx = gsap.context(() => {
        const hero = root.querySelector<HTMLElement>(".home-banner-v2");
        const heroHeadline = hero?.querySelector<HTMLElement>("p.h1");
        const heroTrust = hero?.querySelector<HTMLElement>(".rating-row");
        const heroDesc = hero?.querySelector<HTMLElement>("h1.heading-desc");
        const heroButtons = hero?.querySelector<HTMLElement>(".btn-row");
        const heroDots = hero?.querySelector<HTMLElement>(".hero-dots");

        // Cinematic first-load reveal. SplitText is reverted after the reveal so
        // the existing rotating React hero copy remains completely safe.
        if (hero && heroHeadline) {
          const split = SplitText.create(heroHeadline, {
            type: "words",
            wordsClass: "homepage-hero-word",
            mask: "words",
            aria: "auto",
          });

          const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (heroTrust) {
            heroTl.from(heroTrust, { y: 14, opacity: 0, duration: 0.65 }, 0.18);
          }
          heroTl.from(split.words, { yPercent: 118, opacity: 0, duration: 0.82, stagger: 0.065 }, 0.28);
          if (heroDesc) {
            heroTl.from(heroDesc, { y: 20, opacity: 0, duration: 0.72 }, 0.58);
          }
          if (heroButtons) {
            heroTl.from(heroButtons.children, { y: 18, opacity: 0, duration: 0.62, stagger: 0.09 }, 0.72);
          }
          if (heroDots) {
            heroTl.from(heroDots, { y: 10, opacity: 0, duration: 0.5 }, 0.92);
          }
          heroTl.call(() => split.revert(), [], 1.55);

          const heroMedia = hero.querySelector<HTMLElement>(".media-box");
          const heroContent = hero.querySelector<HTMLElement>(".content");
          if (heroMedia) {
            gsap.fromTo(
              heroMedia,
              { scale: 1.035 },
              {
                scale: 1.075,
                yPercent: 7,
                ease: "none",
                scrollTrigger: {
                  trigger: hero,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.8,
                },
              }
            );
          }
          if (heroContent) {
            gsap.to(heroContent, {
              y: 54,
              opacity: 0.4,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "42% top",
                end: "bottom top",
                scrub: 0.7,
              },
            });
          }
        }

        // Stats / value panels.
        const statSection = root.querySelector<HTMLElement>(".number-panels");
        const statItems = statSection?.querySelectorAll<HTMLElement>(".item");
        if (statSection && statItems?.length) {
          gsap.from(statItems, {
            y: 40,
            opacity: 0,
            scale: 0.975,
            duration: 0.78,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: statSection,
              start: "top 88%",
              once: true,
            },
          });
        }

        // Story text + editorial image mask reveal.
        const story = root.querySelector<HTMLElement>("#story");
        if (story) {
          const text = story.querySelector<HTMLElement>(".text-box");
          const image = story.querySelector<HTMLElement>(".img-box");
          if (text) {
            gsap.from(text.children, {
              y: 24,
              opacity: 0,
              duration: 0.72,
              stagger: 0.09,
              ease: "power3.out",
              scrollTrigger: { trigger: story, start: "top 75%", once: true },
            });
          }
          if (image) {
            gsap.fromTo(
              image,
              { clipPath: "inset(10% 0 0 12% round 24px)", scale: 1.045, opacity: 0.55 },
              {
                clipPath: "inset(0% 0% 0% 0% round 24px)",
                scale: 1,
                opacity: 1,
                duration: 1.05,
                ease: "power3.out",
                scrollTrigger: { trigger: image, start: "top 82%", once: true },
              }
            );
            if (desktop) {
              gsap.to(image, {
                y: -24,
                ease: "none",
                scrollTrigger: { trigger: story, start: "top bottom", end: "bottom top", scrub: 1 },
              });
            }
          }
        }

        // Static section title reveals via SplitText.
        const splitTargets = gsap.utils.toArray<HTMLElement>("[data-motion-split]");
        splitTargets.forEach((target) => {
          const split = SplitText.create(target, {
            type: "words",
            wordsClass: "homepage-section-word",
            mask: "words",
            aria: "auto",
          });
          gsap.from(split.words, {
            yPercent: 105,
            opacity: 0,
            duration: 0.72,
            stagger: 0.035,
            ease: "power3.out",
            scrollTrigger: {
              trigger: target,
              start: "top 88%",
              once: true,
            },
            onComplete: () => split.revert(),
          });
        });

        // Treatment journey cards.
        const journey = root.querySelector<HTMLElement>(".smile-journey-section");
        const journeyCards = journey?.querySelectorAll<HTMLElement>(".journey-step-card");
        if (journey && journeyCards?.length) {
          gsap.from(journeyCards, {
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power2.out",
            clearProps: "opacity",
            scrollTrigger: { trigger: journey, start: "top 72%", once: true },
          });

          const journeyBodies = journey.querySelectorAll<HTMLElement>(".journey-step-card .step-content-body");
          gsap.from(journeyBodies, {
            y: 28,
            opacity: 0,
            duration: 0.78,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: journey, start: "top 72%", once: true },
          });

          const trustItems = journey.querySelectorAll<HTMLElement>(".journey-trust-bar .trust-item");
          if (trustItems.length) {
            gsap.from(trustItems, {
              y: 14,
              opacity: 0,
              duration: 0.55,
              stagger: 0.07,
              scrollTrigger: { trigger: ".journey-trust-bar", start: "top 90%", once: true },
            });
          }
        }

        // DrawSVG + MorphSVG signature mark. Draw the clinical line, then gently
        // morph it into the final smile curve once the journey enters view.
        const motionMark = root.querySelector<SVGPathElement>("[data-motion-mark-primary]");
        const motionMarkTarget = root.querySelector<SVGPathElement>("[data-motion-mark-target]");
        if (motionMark && motionMarkTarget) {
          gsap.set(motionMark, { drawSVG: "0%" });
          const markTl = gsap.timeline({
            scrollTrigger: {
              trigger: motionMark.closest(".journey-motion-mark") ?? motionMark,
              start: "top 88%",
              once: true,
            },
          });
          markTl
            .to(motionMark, { drawSVG: "100%", duration: 0.9, ease: "power2.out" })
            .to(
              motionMark,
              {
                morphSVG: { shape: motionMarkTarget },
                duration: 0.95,
                ease: "power2.inOut",
              },
              "+=0.08"
            );
        }

        // Treatment cards: stagger into view, then use restrained image depth on hover.
        const treatmentCards = root.querySelectorAll<HTMLElement>(".treatment-card-item");
        if (treatmentCards.length) {
          gsap.from(treatmentCards, {
            y: 48,
            opacity: 0,
            scale: 0.975,
            duration: 0.75,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: { trigger: ".treatment-grid-list", start: "top 82%", once: true },
          });

          if (finePointer) {
            treatmentCards.forEach((card) => {
              const img = card.querySelector<HTMLElement>(".card-bg-box img");
              if (!img) return;
              const enter = () => gsap.to(img, { scale: 1.045, duration: 0.55, ease: "power3.out", overwrite: true });
              const leave = () => gsap.to(img, { scale: 1, duration: 0.7, ease: "power3.out", overwrite: true });
              card.addEventListener("mouseenter", enter);
              card.addEventListener("mouseleave", leave);
              eventCleanups.push(() => {
                card.removeEventListener("mouseenter", enter);
                card.removeEventListener("mouseleave", leave);
              });
            });
          }
        }

        // Why Choose signature stack: CSS handles sticky geometry; ScrollTrigger
        // supplies focus/depth without fighting sticky transforms.
        const whySection = root.querySelector<HTMLElement>(".steps-scroll");
        const stackCards = whySection?.querySelectorAll<HTMLElement>(".stack-card");
        if (whySection && stackCards?.length) {
          stackCards.forEach((card, index) => {
            const inner = card.querySelector<HTMLElement>(".stack-card-inner");
            if (!inner) return;

            gsap.from(inner, {
              y: 38,
              opacity: 0,
              scale: 0.975,
              duration: 0.68,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                once: true,
              },
            });

            if (desktop) {
              ScrollTrigger.create({
                trigger: card,
                start: `top ${170 + index * 34}px`,
                end: "bottom 22%",
                onToggle: (self) => card.classList.toggle("motion-current", self.isActive),
              });
            }
          });
        }

        // Smile simulator and before/after cards reveal as product-like UI, not generic fade-ins.
        const simulator = root.querySelector<HTMLElement>(".smile-simulator-section");
        if (simulator) {
          const display = simulator.querySelector<HTMLElement>(".simulator-display-col");
          const controls = simulator.querySelector<HTMLElement>(".simulator-controls-col");
          if (display) {
            gsap.from(display, {
              x: -42,
              opacity: 0,
              scale: 0.975,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 72%", once: true },
            });
          }
          if (controls) {
            gsap.from(controls.children, {
              x: 32,
              opacity: 0,
              duration: 0.72,
              stagger: 0.07,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 70%", once: true },
            });
          }
        }

        const beforeAfterCards = root.querySelectorAll<HTMLElement>(".home-before-after-section .before-after-card");
        if (beforeAfterCards.length) {
          gsap.from(beforeAfterCards, {
            y: 46,
            opacity: 0,
            scale: 0.98,
            duration: 0.78,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: ".home-before-after-section", start: "top 74%", once: true },
          });
        }

        // Scroll-velocity responsive marquee. CSS remains the no-JS fallback.
        const marquee = root.querySelector<HTMLElement>(".marquee-text");
        const marqueeRow = marquee?.querySelector<HTMLElement>(".marquee-row");
        if (marquee && marqueeRow) {
          const marqueeTween = gsap.fromTo(
            marqueeRow,
            { xPercent: 0 },
            { xPercent: -50, duration: 23, repeat: -1, ease: "none" }
          );

          let restingDirection = 1;
          const settle = gsap.delayedCall(0.18, () => {
            gsap.to(marqueeTween, {
              timeScale: restingDirection * 1,
              duration: 0.55,
              ease: "power2.out",
              overwrite: true,
            });
          }).pause();
          delayedCalls.push(settle);

          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
              restingDirection = self.direction >= 0 ? 1 : -1;
              const velocity = Math.abs(self.getVelocity());
              const speed = gsap.utils.clamp(1, 2.8, 1 + velocity / 1800);
              gsap.to(marqueeTween, {
                timeScale: restingDirection * speed,
                duration: 0.22,
                ease: "power1.out",
                overwrite: true,
              });
              settle.restart(true);
            },
          });
        }

        // Payment card: subtle two-direction reveal and image parallax.
        const priceGuide = root.querySelector<HTMLElement>(".price-guide");
        if (priceGuide) {
          const text = priceGuide.querySelector<HTMLElement>(".text-box");
          const image = priceGuide.querySelector<HTMLElement>(".img-box");
          if (text) {
            gsap.from(text.children, {
              x: -26,
              opacity: 0,
              duration: 0.72,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: priceGuide, start: "top 78%", once: true },
            });
          }
          if (image) {
            gsap.from(image, {
              x: 34,
              opacity: 0,
              scale: 0.98,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: { trigger: priceGuide, start: "top 78%", once: true },
            });
          }
        }

        // FAQ rows enter in sequence; open/close animation is handled inside the component.
        const faqItems = root.querySelectorAll<HTMLElement>(".faq-section-luxury .faq-item");
        if (faqItems.length) {
          gsap.from(faqItems, {
            y: 22,
            opacity: 0,
            duration: 0.58,
            stagger: 0.065,
            ease: "power3.out",
            scrollTrigger: { trigger: ".faq-section-luxury", start: "top 75%", once: true },
          });
        }

        // Restrained magnetic interaction for key CTAs only. Max travel is tiny by design.
        if (finePointer) {
          const magneticTargets = document.querySelectorAll<HTMLElement>(
            ".homepage-header .btn-call, .homepage-header .btn-blue, .luxury-homepage-root .hero-primary-cta, .luxury-homepage-root .hero-secondary-cta, .luxury-homepage-root .price-guide .btn-download"
          );

          magneticTargets.forEach((target) => {
            const xTo = gsap.quickTo(target, "x", { duration: 0.35, ease: "power3.out" });
            const yTo = gsap.quickTo(target, "y", { duration: 0.35, ease: "power3.out" });
            const move = (event: MouseEvent) => {
              const rect = target.getBoundingClientRect();
              const dx = event.clientX - (rect.left + rect.width / 2);
              const dy = event.clientY - (rect.top + rect.height / 2);
              xTo(gsap.utils.clamp(-5, 5, dx * 0.08));
              yTo(gsap.utils.clamp(-4, 4, dy * 0.08));
            };
            const leave = () => {
              xTo(0);
              yTo(0);
            };
            target.addEventListener("mousemove", move);
            target.addEventListener("mouseleave", leave);
            eventCleanups.push(() => {
              target.removeEventListener("mousemove", move);
              target.removeEventListener("mouseleave", leave);
            });
          });
        }
      }, root);

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      eventCleanups.push(() => window.removeEventListener("load", refresh));
      const refreshTimer = window.setTimeout(refresh, 450);

      dispose = () => {
        window.clearTimeout(refreshTimer);
        eventCleanups.forEach((fn) => fn());
        delayedCalls.forEach((call) => call.kill());
        ctx.revert();
        lenis.off("scroll", onLenisScroll);
        lenis.destroy();
        gsap.ticker.remove(ticker);
        document.documentElement.classList.remove("homepage-motion-enabled", "homepage-motion-reduced");
      };
    };

    void setup();

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return null;
}
