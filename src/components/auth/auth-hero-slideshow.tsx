"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

interface Slide {
  image: string;
  badge: string;
}

const slides: Slide[] = [
  {
    image: "/marketing/hero_clinic.png",
    badge: "Precision-Led Care",
  },
  {
    image: "/marketing/hero_smile.png",
    badge: "Bespoke Veneers & Aesthetics",
  },
  {
    image: "/marketing/hero_dentist.png",
    badge: "Calm Clinical Environment",
  },
  {
    image: "/marketing/hero_implant.png",
    badge: "Guided Surgery & Stability",
  },
  {
    image: "/marketing/hero_aligners.png",
    badge: "Invisalign® Clear Aligners",
  },
];

const AUTO_SLIDE_INTERVAL = 6500;

export function AuthHeroSlideshow() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, []);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, []);

  const goToSlide = React.useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  // Autoplay ticker
  React.useEffect(() => {
    if (isPaused) return;

    const tickInterval = 50;
    const increment = (tickInterval / AUTO_SLIDE_INTERVAL) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Background Wallpaper Slideshow */}
      <div className="relative w-full h-full">
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover object-center scale-105 transition-transform duration-[7000ms] ease-out"
              style={{
                transform: i === currentIndex ? "scale(1)" : "scale(1.06)",
              }}
            />
          </div>
        ))}

        {/* 2. Exact Home Page Luxury Cinematic Overlay */}
        <div
          className="absolute inset-0 z-20"
          style={{
            background:
              "linear-gradient(180deg, rgba(20, 28, 32, 0.75) 0%, rgba(20, 28, 32, 0.40) 38%, rgba(20, 28, 32, 0.60) 68%, rgba(39, 51, 56, 0.92) 88%, #273338 100%), radial-gradient(ellipse at 50% 48%, rgba(20, 28, 32, 0.2) 0%, rgba(20, 28, 32, 0.75) 90%)",
          }}
        />
      </div>

      {/* 3. Floating Left / Right Navigation Controls (pointer-events-auto) */}
      <button
        type="button"
        onClick={prevSlide}
        className="pointer-events-auto absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 size-11 rounded-full bg-[#141C20]/45 backdrop-blur-xl border border-white/20 text-white hidden md:flex items-center justify-center hover:bg-[#0B3B36]/90 hover:border-[#9CB080]/60 transition-all shadow-xl hover:scale-105 cursor-pointer"
        aria-label="Previous background"
      >
        <ChevronLeft className="size-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="pointer-events-auto absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 size-11 rounded-full bg-[#141C20]/45 backdrop-blur-xl border border-white/20 text-white hidden md:flex items-center justify-center hover:bg-[#0B3B36]/90 hover:border-[#9CB080]/60 transition-all shadow-xl hover:scale-105 cursor-pointer"
        aria-label="Next background"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* 4. Bottom Slide Indicator Controller */}
      <div className="pointer-events-auto absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full bg-[#141C20]/60 backdrop-blur-xl border border-white/15 px-4 py-2 shadow-2xl">
        <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-white/90">
          <span>{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/60">{String(slides.length).padStart(2, "0")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex ? "w-6 bg-[#9CB080]" : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9CB080] pl-1 border-l border-white/15">
          <ShieldCheck className="size-3" />
          <span>{slides[currentIndex].badge}</span>
        </div>
      </div>
    </div>
  );
}
