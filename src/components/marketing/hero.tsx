"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { MagneticButton, ParallaxLayer } from "@/components/motion";
import { AvailabilityDialog } from "@/components/marketing/availability-dialog";
import { CONTAINER } from "@/lib/layout";
import { HERO_SLIDES, imageSrc } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: CalendarCheck, label: "Same-week appointments" },
  { icon: ShieldCheck, label: "Secure patient records" },
  { icon: Sparkles, label: "Modern, connected care" },
];

const SLIDE_DURATION = 7000;

interface Service {
  id: string;
  name: string;
}
interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

export function Hero({ services, practitioners }: { services: Service[]; practitioners: Practitioner[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [slide, setSlide] = React.useState(0);
  const current = HERO_SLIDES[slide];

  React.useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-end overflow-hidden">
      {/* Background photo — crossfades + slow Ken Burns drift per slide. */}
      <ParallaxLayer speed={0.15} className="absolute inset-0 -z-20">
        <AnimatePresence initial={false}>
          <motion.div
            key={slide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={shouldReduceMotion ? undefined : { scale: 1.1 }}
              transition={{ duration: (SLIDE_DURATION / 1000) * 1.4, ease: "easeOut" }}
            >
              <Image
                src={imageSrc(current.image, 2400)}
                alt={current.image.alt}
                fill
                priority={slide === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </ParallaxLayer>

      {/* Bottom-anchored gradient — deliberately heavy at the base (from-black/90) so
          the content row below always sits on a guaranteed-dark, readable zone no
          matter which slide/photo is showing, instead of guessing a "safe" spot on
          each individual image. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/30 to-black/10" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/40 via-transparent to-transparent" aria-hidden />

      <div className={cn(CONTAINER, "flex flex-col gap-10 pb-14 pt-40 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-16")}>
        {/* Left content — headline/subtext change per slide; CTAs and highlights stay put. */}
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-medium tracking-wide text-white/80">{current.eyebrow}</p>
              <h1 className="mt-3 font-serif text-display-hero text-balance text-white">
                {current.headline} <span className="text-accent">{current.headlineAccent}</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-white/85 sm:text-lg">{current.subtext}</p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <MagneticButton>
              <ButtonLink href="/book" size="lg" className="h-11 gap-2 bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90">
                Book an appointment
                <ArrowRight className="size-4" />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href="/practitioners"
              size="lg"
              variant="outline"
              className="h-11 border-white/30 bg-white/5 px-6 text-base text-white hover:bg-white/15"
            >
              Meet our specialists
            </ButtonLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/80 sm:text-sm"
          >
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {label}
              </li>
            ))}
          </motion.ul>

          {/* Slide indicators */}
          <div className="mt-8 flex gap-1.5">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.image.id}
                onClick={() => setSlide(i)}
                aria-label={`Show slide ${i + 1}`}
                data-active={i === slide}
                className="h-1.5 w-6 rounded-full bg-white/30 transition-all data-[active=true]:w-10 data-[active=true]:bg-white"
              />
            ))}
          </div>
        </div>

        {/* Booking trigger — a normal flex sibling (not absolutely positioned), so it
            always sits in the same guaranteed-dark bottom zone as the text, next to
            it on desktop and stacked below it on mobile. Opens full-screen on click
            and stays fixed regardless of which slide is showing. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full shrink-0 lg:w-auto"
        >
          <AvailabilityDialog services={services} practitioners={practitioners} className="w-full lg:w-auto" />
        </motion.div>
      </div>
    </section>
  );
}
