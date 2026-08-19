"use client";

import * as React from "react";

/**
 * Homepage-only motion orchestrator.
 *
 * Scope is intentionally limited to `.luxury-homepage-root` plus the homepage
 * header/footer elements. It mounts Lenis only while the homepage is mounted and
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

      // Lenis smooth scroll for the homepage
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
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
        // ===================================================================
        // 1. HERO SECTION ENTRANCE & PARALLAX
        // ===================================================================
        const hero = root.querySelector<HTMLElement>(".luxury-hero-section, .home-banner-v2");
        const heroHeadline = hero?.querySelector<HTMLElement>(".hero-display-title, p.h1");
        const heroTrust = hero?.querySelector<HTMLElement>(".hero-kicker-pill, .rating-row");
        const heroDesc = hero?.querySelector<HTMLElement>(".hero-editorial-desc, h1.heading-desc");
        const heroButtons = hero?.querySelector<HTMLElement>(".hero-cta-group, .btn-row");
        const heroChips = hero?.querySelector<HTMLElement>(".hero-trust-chips");
        const heroController = hero?.querySelector<HTMLElement>(".hero-bottom-controller, .hero-dots");

        if (hero && heroHeadline) {
          const split = SplitText.create(heroHeadline, {
            type: "words",
            wordsClass: "homepage-hero-word",
            mask: "words",
            aria: "auto",
          });

          const heroTl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              if (heroButtons) gsap.set(heroButtons.children, { clearProps: "all" });
              if (heroTrust) gsap.set(heroTrust, { clearProps: "all" });
              if (heroDesc) gsap.set(heroDesc, { clearProps: "all" });
              if (heroChips) gsap.set(heroChips.children, { clearProps: "all" });
              if (heroController) gsap.set(heroController, { clearProps: "all" });
            },
          });

          if (heroTrust) {
            heroTl.fromTo(
              heroTrust,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7, clearProps: "all" },
              0.15,
            );
          }
          heroTl.fromTo(
            split.words,
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.055, clearProps: "all" },
            0.25,
          );
          if (heroDesc) {
            heroTl.fromTo(
              heroDesc,
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.75, clearProps: "all" },
              0.55,
            );
          }
          if (heroButtons && heroButtons.children.length > 0) {
            heroTl.fromTo(
              heroButtons.children,
              { y: 20, scale: 0.94, opacity: 0 },
              { y: 0, scale: 1, opacity: 1, duration: 0.65, stagger: 0.1, clearProps: "all" },
              0.7,
            );
          }
          if (heroChips && heroChips.children.length > 0) {
            heroTl.fromTo(
              heroChips.children,
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, clearProps: "all" },
              0.85,
            );
          }
          if (heroController) {
            heroTl.fromTo(
              heroController,
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55, clearProps: "all" },
              0.95,
            );
          }
          heroTl.call(() => split.revert(), [], 1.6);

          const heroContent = hero.querySelector<HTMLElement>(".hero-content-wrapper, .content");
          if (heroContent) {
            gsap.to(heroContent, {
              y: -50,
              opacity: 0.25,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });
          }
        }

        // ===================================================================
        // 2. STATS / NUMBER VALUE PANELS
        // ===================================================================
        const statSection = root.querySelector<HTMLElement>(".number-panels");
        const statItems = statSection?.querySelectorAll<HTMLElement>(".item");
        if (statSection && statItems?.length) {
          gsap.from(statItems, {
            y: 45,
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: statSection,
              start: "top 86%",
              once: true,
            },
          });
        }

        // ===================================================================
        // 3. STORY / INTRO SECTION
        // ===================================================================
        const story = root.querySelector<HTMLElement>("#story");
        if (story) {
          const subtitle = story.querySelector<HTMLElement>(".subtitle-italic");
          const headline = story.querySelector<HTMLElement>("h2");
          const paragraphs = story.querySelectorAll<HTMLElement>(".text-box p");
          const buttons = story.querySelectorAll<HTMLElement>(".btn-group a, .btn-group button");
          const imageBox = story.querySelector<HTMLElement>(".img-box");

          const storyTl = gsap.timeline({
            scrollTrigger: { trigger: story, start: "top 78%", once: true },
            defaults: { ease: "power3.out" },
          });

          if (subtitle) {
            storyTl.from(subtitle, { y: 16, opacity: 0, duration: 0.6 }, 0);
          }

          if (headline) {
            const split = SplitText.create(headline, {
              type: "words",
              wordsClass: "homepage-section-word",
              mask: "words",
              aria: "auto",
            });
            storyTl.from(split.words, { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.035 }, 0.1);
            storyTl.call(() => split.revert(), [], 1.4);
          }

          if (paragraphs.length) {
            storyTl.from(paragraphs, { y: 26, opacity: 0, duration: 0.72, stagger: 0.12 }, 0.35);
          }

          if (buttons.length) {
            storyTl.from(buttons, { y: 20, scale: 0.94, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.55);
          }

          if (imageBox) {
            gsap.fromTo(
              imageBox,
              { clipPath: "inset(12% 0% 0% 10% round 28px)", scale: 1.06, opacity: 0.4 },
              {
                clipPath: "inset(0% 0% 0% 0% round 28px)",
                scale: 1,
                opacity: 1,
                duration: 1.15,
                ease: "power3.out",
                scrollTrigger: { trigger: imageBox, start: "top 82%", once: true },
              }
            );

            if (desktop) {
              gsap.to(imageBox, {
                y: -30,
                ease: "none",
                scrollTrigger: { trigger: story, start: "top bottom", end: "bottom top", scrub: 1.2 },
              });
            }
          }
        }

        // ===================================================================
        // 4. GENERAL HEADLINE SPLITTEXT REVEALS
        // ===================================================================
        const splitTargets = gsap.utils.toArray<HTMLElement>("[data-motion-split]");
        splitTargets.forEach((target) => {
          if (target.closest("#story")) return;

          const split = SplitText.create(target, {
            type: "words",
            wordsClass: "homepage-section-word",
            mask: "words",
            aria: "auto",
          });
          gsap.from(split.words, {
            yPercent: 110,
            opacity: 0,
            duration: 0.78,
            stagger: 0.035,
            ease: "power3.out",
            scrollTrigger: {
              trigger: target,
              start: "top 86%",
              once: true,
            },
            onComplete: () => split.revert(),
          });
        });

        // ===================================================================
        // 5. TREATMENT JOURNEY SECTION
        // ===================================================================
        const journey = root.querySelector<HTMLElement>(".smile-journey-section");
        const journeyCards = journey?.querySelectorAll<HTMLElement>(".journey-step-card");
        const journeyGlowPrimary = journey?.querySelector<HTMLElement>(".journey-ambient-glow-primary");
        const journeyGlowSecondary = journey?.querySelector<HTMLElement>(".journey-ambient-glow-secondary");

        if (journey && desktop) {
          if (journeyGlowPrimary && journeyGlowSecondary) {
            gsap.to(journeyGlowPrimary, {
              y: 30,
              ease: "none",
              scrollTrigger: {
                trigger: journey,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
            gsap.to(journeyGlowSecondary, {
              y: -30,
              ease: "none",
              scrollTrigger: {
                trigger: journey,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          }
        }

        if (journey) {
          const journeyBadge = journey.querySelector<HTMLElement>(".header-badge-dark");
          const journeySubtitle = journey.querySelector<HTMLElement>(".journey-subtitle");

          if (journeyBadge) {
            gsap.from(journeyBadge, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: journey, start: "top 82%", once: true },
            });
          }

          if (journeySubtitle) {
            gsap.from(journeySubtitle, {
              y: 22,
              opacity: 0,
              duration: 0.72,
              ease: "power3.out",
              scrollTrigger: { trigger: journey, start: "top 78%", once: true },
            });
          }

          if (journeyCards?.length) {
            gsap.from(journeyCards, {
              y: 50,
              scale: 0.94,
              opacity: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: ".journey-grid-4", start: "top 80%", once: true },
            });

            const numberPills = journey.querySelectorAll<HTMLElement>(".journey-step-card .step-number-pill");
            if (numberPills.length) {
              gsap.from(numberPills, {
                scale: 0.75,
                opacity: 0,
                duration: 0.55,
                stagger: 0.12,
                ease: "back.out(1.6)",
                scrollTrigger: { trigger: ".journey-grid-4", start: "top 80%", once: true },
              });
            }

            const icons = journey.querySelectorAll<HTMLElement>(".journey-step-card .step-icon-wrapper");
            if (icons.length) {
              gsap.from(icons, {
                scale: 0.8,
                rotate: -10,
                opacity: 0,
                duration: 0.6,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: { trigger: ".journey-grid-4", start: "top 80%", once: true },
              });
            }
          }

          const trustBar = journey.querySelector<HTMLElement>(".journey-trust-bar");
          if (trustBar) {
            const trustItems = trustBar.querySelectorAll<HTMLElement>(".trust-item");
            const trustCta = trustBar.querySelector<HTMLElement>(".journey-book-cta");

            gsap.from(trustItems, {
              y: 18,
              opacity: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: { trigger: trustBar, start: "top 88%", once: true },
            });

            if (trustCta) {
              gsap.from(trustCta, {
                scale: 0.92,
                opacity: 0,
                duration: 0.65,
                ease: "back.out(1.5)",
                scrollTrigger: { trigger: trustBar, start: "top 88%", once: true },
              });
            }
          }
        }

        // DrawSVG + MorphSVG signature mark
        const motionMark = root.querySelector<SVGPathElement>("[data-motion-mark-primary]");
        const motionMarkTarget = root.querySelector<SVGPathElement>("[data-motion-mark-target]");
        if (motionMark && motionMarkTarget) {
          gsap.set(motionMark, { drawSVG: "0%" });
          const markTl = gsap.timeline({
            scrollTrigger: {
              trigger: motionMark.closest(".journey-motion-mark") ?? motionMark,
              start: "top 86%",
              once: true,
            },
          });
          markTl
            .to(motionMark, { drawSVG: "100%", duration: 0.95, ease: "power2.out" })
            .to(
              motionMark,
              {
                morphSVG: { shape: motionMarkTarget },
                duration: 1.0,
                ease: "power2.inOut",
              },
              "+=0.06"
            );
        }

        // ===================================================================
        // 6. OUR DENTAL TREATMENTS SECTION
        // ===================================================================
        const treatmentSection = root.querySelector<HTMLElement>("#treatments, .four-columns-card");
        if (treatmentSection) {
          const titleBox = treatmentSection.querySelector<HTMLElement>(".title-box");
          const subtitle = titleBox?.querySelector<HTMLElement>(".subtitle-italic");
          const divider = titleBox?.querySelector<HTMLElement>(".divider-line");
          const treatmentCards = treatmentSection.querySelectorAll<HTMLElement>(".treatment-card-item");
          const treatmentCta = treatmentSection.querySelector<HTMLElement>(".treatment-view-all-cta");

          if (subtitle) {
            gsap.from(subtitle, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: treatmentSection, start: "top 82%", once: true },
            });
          }

          if (divider) {
            gsap.from(divider, {
              scaleX: 0,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: { trigger: treatmentSection, start: "top 80%", once: true },
            });
          }

          if (treatmentCards.length) {
            gsap.from(treatmentCards, {
              y: 55,
              scale: 0.95,
              opacity: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: ".treatment-grid-list", start: "top 80%", once: true },
            });

            if (desktop) {
              treatmentCards.forEach((card) => {
                const img = card.querySelector<HTMLElement>(".card-bg-box img");
                if (img) {
                  gsap.fromTo(
                    img,
                    { yPercent: -5 },
                    {
                      yPercent: 5,
                      ease: "none",
                      scrollTrigger: {
                        trigger: card,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1.2,
                      },
                    }
                  );
                }
              });
            }
          }

          if (treatmentCta) {
            gsap.from(treatmentCta, {
              y: 20,
              scale: 0.94,
              opacity: 0,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: treatmentCta, start: "top 90%", once: true },
            });
          }

          // Treatment CTA Magnetic microinteraction on desktop
          if (treatmentCta && finePointer) {
            const handleMouseMove = (e: MouseEvent) => {
              const rect = treatmentCta.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              const moveX = (x / (rect.width / 2)) * 4;
              const moveY = (y / (rect.height / 2)) * 4;

              gsap.to(treatmentCta, {
                x: moveX,
                y: moveY,
                duration: 0.25,
                ease: "power2.out",
              });

              const icon = treatmentCta.querySelector<HTMLElement>("svg");
              if (icon) {
                gsap.to(icon, {
                  x: moveX * 1.5,
                  y: moveY * 1.5,
                  duration: 0.25,
                  ease: "power2.out",
                });
              }
            };

            const handleMouseLeave = () => {
              gsap.to(treatmentCta, {
                x: 0,
                y: 0,
                duration: 0.35,
                ease: "power3.out",
              });
              const icon = treatmentCta.querySelector<HTMLElement>("svg");
              if (icon) {
                gsap.to(icon, {
                  x: 0,
                  y: 0,
                  duration: 0.35,
                  ease: "power3.out",
                });
              }
            };

            treatmentCta.addEventListener("mousemove", handleMouseMove);
            treatmentCta.addEventListener("mouseleave", handleMouseLeave);
            eventCleanups.push(() => {
              treatmentCta.removeEventListener("mousemove", handleMouseMove);
              treatmentCta.removeEventListener("mouseleave", handleMouseLeave);
            });
          }
        }

        // ===================================================================
        // 7. WHY CHOOSE — PINNED STACKED CARDS
        // ===================================================================
        const whySection = root.querySelector<HTMLElement>(".steps-scroll");
        const stackCards = whySection?.querySelectorAll<HTMLElement>(".stack-card");

        if (whySection) {
          const leftKicker = whySection.querySelector<HTMLElement>(".section-kicker-light");
          const leftParagraphs = whySection.querySelectorAll<HTMLElement>(".steps-scroll-left p");
          const leftCta = whySection.querySelector<HTMLElement>(".steps-scroll-left .btn");

          if (leftKicker) {
            gsap.from(leftKicker, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: whySection, start: "top 80%", once: true },
            });
          }

          if (leftParagraphs.length) {
            gsap.from(leftParagraphs, {
              y: 22,
              opacity: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: whySection, start: "top 78%", once: true },
            });
          }

          if (leftCta) {
            gsap.from(leftCta, {
              y: 18,
              scale: 0.94,
              opacity: 0,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: whySection, start: "top 76%", once: true },
            });
          }
        }

        if (whySection && stackCards && stackCards.length === 4 && desktop) {
          const [c1, c2, c3, c4] = Array.from(stackCards);

          gsap.set(c1, { y: 0, opacity: 1, scale: 1, transformOrigin: "center top" });
          gsap.set([c2, c3, c4], {
            yPercent: 125,
            opacity: 0,
            scale: 0.96,
            transformOrigin: "center top",
          });

          const stackTl = gsap.timeline({
            scrollTrigger: {
              trigger: whySection,
              start: "top top+=90",
              end: "+=2600",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Stage 1: Card 02
          stackTl
            .to(c2, { yPercent: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, "card2")
            .to(c1, { scale: 0.965, y: -10, opacity: 0.82, duration: 1.2, ease: "power2.out" }, "card2");
          stackTl.to({}, { duration: 0.4 });

          // Stage 2: Card 03
          stackTl
            .to(c3, { yPercent: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, "card3")
            .to(c2, { scale: 0.965, y: -10, opacity: 0.82, duration: 1.2, ease: "power2.out" }, "card3")
            .to(c1, { scale: 0.93, y: -20, opacity: 0.65, duration: 1.2, ease: "power2.out" }, "card3");
          stackTl.to({}, { duration: 0.4 });

          // Stage 3: Card 04
          stackTl
            .to(c4, { yPercent: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, "card4")
            .to(c3, { scale: 0.965, y: -10, opacity: 0.82, duration: 1.2, ease: "power2.out" }, "card4")
            .to(c2, { scale: 0.93, y: -20, opacity: 0.65, duration: 1.2, ease: "power2.out" }, "card4")
            .to(c1, { scale: 0.895, y: -30, opacity: 0.48, duration: 1.2, ease: "power2.out" }, "card4");
          stackTl.to({}, { duration: 0.8 });
        } else if (whySection && stackCards?.length && !desktop) {
          gsap.from(stackCards, {
            y: 35,
            opacity: 0,
            duration: 0.65,
            stagger: 0.12,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: whySection,
              start: "top 82%",
              once: true,
            },
          });
        }

        // ===================================================================
        // 8. SMILE PREFERENCES 3D SIMULATOR
        // ===================================================================
        const simulator = root.querySelector<HTMLElement>(".smile-simulator-section");
        if (simulator) {
          const display = simulator.querySelector<HTMLElement>(".simulator-display-col");
          const simCard = simulator.querySelector<HTMLElement>(".simulator-3d-card");
          const subtitle = simulator.querySelector<HTMLElement>(".subtitle-italic");
          const intro = simulator.querySelector<HTMLElement>(".controls-intro");
          const optionPills = simulator.querySelectorAll<HTMLElement>(".pill-btn");
          const shadeButtons = simulator.querySelectorAll<HTMLElement>(".shade-circle-btn");
          const shapeButtons = simulator.querySelectorAll<HTMLElement>(".shape-btn");
          const ctaBox = simulator.querySelector<HTMLElement>(".simulator-action-box");

          if (display) {
            gsap.from(display, {
              x: -45,
              opacity: 0,
              scale: 0.95,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 78%", once: true },
            });

            const hudItems = display.querySelectorAll<HTMLElement>(".hud-item");
            if (hudItems.length) {
              gsap.from(hudItems, {
                y: 12,
                opacity: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: "power2.out",
                scrollTrigger: { trigger: display, start: "top 75%", once: true },
              });
            }
          }

          if (subtitle) {
            gsap.from(subtitle, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: simulator, start: "top 78%", once: true },
            });
          }

          if (intro) {
            gsap.from(intro, {
              y: 20,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 76%", once: true },
            });
          }

          if (optionPills.length) {
            gsap.from(optionPills, {
              y: 18,
              opacity: 0,
              duration: 0.55,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: { trigger: ".pills-grid", start: "top 85%", once: true },
            });
          }

          if (shadeButtons.length) {
            gsap.from(shadeButtons, {
              scale: 0.88,
              opacity: 0,
              duration: 0.5,
              stagger: 0.05,
              ease: "back.out(1.4)",
              scrollTrigger: { trigger: ".shades-row", start: "top 85%", once: true },
            });
          }

          if (shapeButtons.length) {
            gsap.from(shapeButtons, {
              y: 18,
              opacity: 0,
              duration: 0.55,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: { trigger: ".shapes-grid", start: "top 85%", once: true },
            });
          }

          if (ctaBox) {
            gsap.from(ctaBox.children, {
              y: 20,
              opacity: 0,
              duration: 0.65,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: { trigger: ctaBox, start: "top 90%", once: true },
            });
          }

          if (simCard && desktop) {
            gsap.to(simCard, {
              y: -26,
              scale: 1.015,
              ease: "none",
              scrollTrigger: {
                trigger: simulator,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          }
        }

        // ===================================================================
        // 9. BEFORE & AFTER SHOWCASE
        // ===================================================================
        const beforeAfterSection = root.querySelector<HTMLElement>(".home-before-after-section");
        if (beforeAfterSection) {
          const subtitle = beforeAfterSection.querySelector<HTMLElement>(".subtitle-italic");
          const copy = beforeAfterSection.querySelector<HTMLElement>(".home-section-copy");
          const beforeAfterCards = beforeAfterSection.querySelectorAll<HTMLElement>(".before-after-card");
          const cta = beforeAfterSection.querySelector<HTMLElement>(".btn");

          if (subtitle) {
            gsap.from(subtitle, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: beforeAfterSection, start: "top 80%", once: true },
            });
          }

          if (copy) {
            gsap.from(copy, {
              y: 20,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: beforeAfterSection, start: "top 78%", once: true },
            });
          }

          if (beforeAfterCards.length) {
            gsap.from(beforeAfterCards, {
              y: 50,
              opacity: 0,
              scale: 0.96,
              duration: 0.85,
              stagger: 0.16,
              ease: "power3.out",
              scrollTrigger: { trigger: ".home-before-after-section .grid", start: "top 78%", once: true },
            });
          }

          if (cta) {
            gsap.from(cta, {
              y: 18,
              scale: 0.94,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: cta, start: "top 90%", once: true },
            });
          }
        }

        // ===================================================================
        // 10. MARQUEE RESPONSIVE TWEEN
        // ===================================================================
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

        // ===================================================================
        // 11. FLEXIBLE PAYMENT OPTIONS
        // ===================================================================
        const priceGuide = root.querySelector<HTMLElement>(".price-guide");
        if (priceGuide) {
          const kicker = priceGuide.querySelector<HTMLElement>(".price-guide-kicker");
          const paragraphs = priceGuide.querySelectorAll<HTMLElement>(".text-box p");
          const btn = priceGuide.querySelector<HTMLElement>(".btn-download");
          const image = priceGuide.querySelector<HTMLElement>(".img-box");

          if (kicker) {
            gsap.from(kicker, {
              x: -24,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: priceGuide, start: "top 78%", once: true },
            });
          }

          if (paragraphs.length) {
            gsap.from(paragraphs, {
              x: -28,
              opacity: 0,
              duration: 0.72,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: priceGuide, start: "top 76%", once: true },
            });
          }

          if (btn) {
            gsap.from(btn, {
              y: 20,
              scale: 0.94,
              opacity: 0,
              duration: 0.65,
              ease: "back.out(1.4)",
              scrollTrigger: { trigger: priceGuide, start: "top 74%", once: true },
            });
          }

          if (image) {
            gsap.from(image, {
              x: 40,
              opacity: 0,
              scale: 0.96,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: priceGuide, start: "top 78%", once: true },
            });

            if (desktop) {
              gsap.to(image, {
                y: -24,
                ease: "none",
                scrollTrigger: { trigger: priceGuide, start: "top bottom", end: "bottom top", scrub: 1.2 },
              });
            }
          }
        }

        // ===================================================================
        // 12. FAQ SECTION
        // ===================================================================
        const faqSection = root.querySelector<HTMLElement>(".faq-section-luxury");
        if (faqSection) {
          const eyebrow = faqSection.querySelector<HTMLElement>(".faq-eyebrow");
          const intro = faqSection.querySelector<HTMLElement>(".faq-intro");
          const faqItems = faqSection.querySelectorAll<HTMLElement>(".faq-item");

          if (eyebrow) {
            gsap.from(eyebrow, {
              y: 16,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: faqSection, start: "top 80%", once: true },
            });
          }

          if (intro) {
            gsap.from(intro, {
              y: 20,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: faqSection, start: "top 78%", once: true },
            });
          }

          if (faqItems.length) {
            gsap.from(faqItems, {
              y: 28,
              opacity: 0,
              duration: 0.65,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: ".faq-list", start: "top 80%", once: true },
            });
          }
        }

        // ===================================================================
        // 13. FOOTER SECTION
        // ===================================================================
        const footer = document.querySelector<HTMLElement>(".luxury-site-footer");
        if (footer) {
          const topBanner = footer.querySelector<HTMLElement>(".footer-top-banner");
          const cols = footer.querySelectorAll<HTMLElement>(".grid .col");
          const bottom = footer.querySelector<HTMLElement>(".bottom");

          if (topBanner) {
            gsap.from(topBanner, {
              y: 35,
              opacity: 0,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: { trigger: footer, start: "top 88%", once: true },
            });
          }

          if (cols.length) {
            gsap.from(cols, {
              y: 30,
              opacity: 0,
              duration: 0.65,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: footer.querySelector(".grid") ?? footer, start: "top 86%", once: true },
            });
          }

          if (bottom) {
            gsap.from(bottom, {
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: bottom, start: "top 95%", once: true },
            });
          }
        }

        // ===================================================================
        // 14. MAGNETIC BUTTON MICRO-INTERACTIONS
        // ===================================================================
        if (finePointer) {
          const magneticTargets = document.querySelectorAll<HTMLElement>(
            ".homepage-header .btn-call, .homepage-header .btn-blue, .luxury-homepage-root .hero-primary-cta, .luxury-homepage-root .hero-secondary-cta, .luxury-homepage-root .price-guide .btn-download, .luxury-homepage-root #story .btn, .luxury-homepage-root #why-choose .btn"
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
