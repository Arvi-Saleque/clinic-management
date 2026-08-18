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
        const hero = root.querySelector<HTMLElement>(".luxury-hero-section, .home-banner-v2");
        const heroHeadline = hero?.querySelector<HTMLElement>(".hero-display-title, p.h1");
        const heroTrust = hero?.querySelector<HTMLElement>(".hero-kicker-pill, .rating-row");
        const heroDesc = hero?.querySelector<HTMLElement>(".hero-editorial-desc, h1.heading-desc");
        const heroButtons = hero?.querySelector<HTMLElement>(".hero-cta-group, .btn-row");
        const heroChips = hero?.querySelector<HTMLElement>(".hero-trust-chips");
        const heroController = hero?.querySelector<HTMLElement>(".hero-bottom-controller, .hero-dots");

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
          if (heroChips) {
            heroTl.from(heroChips, { y: 14, opacity: 0, duration: 0.55 }, 0.86);
          }
          if (heroController) {
            heroTl.from(heroController, { y: 16, opacity: 0, duration: 0.5 }, 0.95);
          }
          heroTl.call(() => split.revert(), [], 1.55);

          const heroContent = hero.querySelector<HTMLElement>(".hero-content-wrapper, .content");
          if (heroContent) {
            gsap.to(heroContent, {
              y: -60,
              opacity: 0.2,
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

        // Treatment journey cards & ambient backdrop.
        const journey = root.querySelector<HTMLElement>(".smile-journey-section");
        const journeyCards = journey?.querySelectorAll<HTMLElement>(".journey-step-card");
        const journeyGlowPrimary = journey?.querySelector<HTMLElement>(".journey-ambient-glow-primary");
        const journeyGlowSecondary = journey?.querySelector<HTMLElement>(".journey-ambient-glow-secondary");

        if (journey && desktop) {
          if (journeyGlowPrimary && journeyGlowSecondary) {
            gsap.to(journeyGlowPrimary, {
              y: 25,
              ease: "none",
              scrollTrigger: {
                trigger: journey,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
            gsap.to(journeyGlowSecondary, {
              y: -25,
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

        // Treatment section entrance sequence, image parallax, and CTA microinteraction
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
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: treatmentSection, start: "top 80%", once: true },
            });
          }

          if (treatmentCards.length) {
            gsap.from(treatmentCards, {
              y: 30,
              opacity: 0,
              scale: 0.985,
              duration: 0.72,
              stagger: 0.1,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: ".treatment-grid-list", start: "top 82%", once: true },
            });

            // Internal image scroll parallax (desktop only)
            if (desktop) {
              treatmentCards.forEach((card) => {
                const img = card.querySelector<HTMLElement>(".card-bg-box img");
                if (img) {
                  gsap.fromTo(
                    img,
                    { yPercent: -4 },
                    {
                      yPercent: 4,
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

          // Treatment CTA Magnetic microinteraction on desktop
          if (treatmentCta && finePointer) {
            const handleMouseMove = (e: MouseEvent) => {
              const rect = treatmentCta.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              const moveX = (x / (rect.width / 2)) * 3.5;
              const moveY = (y / (rect.height / 2)) * 3.5;

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

        // Why Choose — Pinned Stacked Card Storytelling
        const whySection = root.querySelector<HTMLElement>(".steps-scroll");
        const stackCards = whySection?.querySelectorAll<HTMLElement>(".stack-card");

        if (whySection && stackCards && stackCards.length === 4 && desktop) {
          const [c1, c2, c3, c4] = Array.from(stackCards);

          // Initial card states on desktop
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

          // Stage 1: Card 02 arrives & layers on top of Card 01
          stackTl
            .to(
              c2,
              {
                yPercent: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.out",
              },
              "card2"
            )
            .to(
              c1,
              {
                scale: 0.965,
                y: -10,
                opacity: 0.82,
                duration: 1.2,
                ease: "power2.out",
              },
              "card2"
            );

          // Settle pause for Card 02
          stackTl.to({}, { duration: 0.4 });

          // Stage 2: Card 03 arrives & layers on top of Card 02 & 01
          stackTl
            .to(
              c3,
              {
                yPercent: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.out",
              },
              "card3"
            )
            .to(
              c2,
              {
                scale: 0.965,
                y: -10,
                opacity: 0.82,
                duration: 1.2,
                ease: "power2.out",
              },
              "card3"
            )
            .to(
              c1,
              {
                scale: 0.93,
                y: -20,
                opacity: 0.65,
                duration: 1.2,
                ease: "power2.out",
              },
              "card3"
            );

          // Settle pause for Card 03
          stackTl.to({}, { duration: 0.4 });

          // Stage 3: Card 04 arrives & layers on top of Card 03, 02 & 01
          stackTl
            .to(
              c4,
              {
                yPercent: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.out",
              },
              "card4"
            )
            .to(
              c3,
              {
                scale: 0.965,
                y: -10,
                opacity: 0.82,
                duration: 1.2,
                ease: "power2.out",
              },
              "card4"
            )
            .to(
              c2,
              {
                scale: 0.93,
                y: -20,
                opacity: 0.65,
                duration: 1.2,
                ease: "power2.out",
              },
              "card4"
            )
            .to(
              c1,
              {
                scale: 0.895,
                y: -30,
                opacity: 0.48,
                duration: 1.2,
                ease: "power2.out",
              },
              "card4"
            );

          // Settle pause for completed 4-card deck before section unpins
          stackTl.to({}, { duration: 0.8 });
        } else if (whySection && stackCards?.length && !desktop) {
          // Mobile/Tablet: clean natural entrance without pinning
          gsap.from(stackCards, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: whySection,
              start: "top 85%",
              once: true,
            },
          });
        }

        // Smile simulator section: refined entrance and scroll-linked preview panel motion
        const simulator = root.querySelector<HTMLElement>(".smile-simulator-section");
        if (simulator) {
          const display = simulator.querySelector<HTMLElement>(".simulator-display-col");
          const simCard = simulator.querySelector<HTMLElement>(".simulator-3d-card");
          const controls = simulator.querySelector<HTMLElement>(".simulator-controls-col");

          if (display) {
            gsap.from(display, {
              y: 36,
              opacity: 0,
              scale: 0.96,
              duration: 0.92,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 78%", once: true },
            });
          }

          if (controls) {
            gsap.from(controls.children, {
              y: 22,
              opacity: 0,
              duration: 0.75,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: simulator, start: "top 76%", once: true },
            });
          }

          // Subtle scroll-linked parallax on left preview card (desktop only)
          if (simCard && desktop) {
            gsap.to(simCard, {
              y: -24,
              scale: 1.012,
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
