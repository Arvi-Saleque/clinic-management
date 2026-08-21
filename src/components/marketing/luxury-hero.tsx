"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

interface Slide {
  image: string;
  kicker: string;
  badge: string;
  sloganFirst: string;
  sloganSecond: string;
  description: string;
  features: string[];
}

const slides: Slide[] = [
  {
    image: "/marketing/hero_clinic.png",
    kicker: "Digital Smile Architecture",
    badge: "Precision-Led Care",
    sloganFirst: "Dentistry. ",
    sloganSecond: "Reimagined.",
    description:
      "Modern general, restorative, and cosmetic dental care delivered with clinical precision, advanced digital planning, and personalized attention.",
    features: ["3D Digital Scans", "Bespoke Treatment Plans", "Comfort-First Protocol"],
  },
  {
    image: "/marketing/hero_smile.png",
    kicker: "Cosmetic Artistry & Design",
    badge: "Bespoke Veneers & Aesthetics",
    sloganFirst: "Your Smile. ",
    sloganSecond: "Our Focus.",
    description:
      "Thoughtful aesthetic smile design tailored to your natural facial proportions, symmetry, tooth contours, and long-term oral wellness.",
    features: ["Digital Smile Preview", "Handcrafted Ceramics", "Natural Tooth Shading"],
  },
  {
    image: "/marketing/hero_dentist.png",
    kicker: "Gentle & Supportive Care",
    badge: "Calm Clinical Environment",
    sloganFirst: "Comfort. ",
    sloganSecond: "Care. Trust.",
    description:
      "A relaxing dental experience designed to ease clinical anxiety with gentle techniques, clear explanations, and unhurried appointments.",
    features: ["Comfort-Focused Visits", "Transparent Guidance", "Dedicated Follow-Up"],
  },
  {
    image: "/marketing/hero_implant.png",
    kicker: "Restorative & Implant Planning",
    badge: "Guided Surgery & Stability",
    sloganFirst: "Precision. ",
    sloganSecond: "Restored.",
    description:
      "Digitally guided dental implants and full-arch restorative solutions engineered for lasting structural stability, chewing function, and natural aesthetics.",
    features: ["Guided Implant Surgery", "Long-Term Durability", "Full Function Restoration"],
  },
  {
    image: "/marketing/hero_aligners.png",
    kicker: "Orthodontic Solutions",
    badge: "Invisalign® Clear Aligners",
    sloganFirst: "Clarity. ",
    sloganSecond: "Confidence.",
    description:
      "Discreet clear-aligner teeth straightening planned with precision 3D visual outcome simulations and ongoing clinical oversight.",
    features: ["Custom Clear Aligners", "Visual Outcome Simulation", "Flexible Consultations"],
  },
];

const AUTO_SLIDE_INTERVAL = 6000;

export function LuxuryHero() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [displayIndex, setDisplayIndex] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const nextSlide = React.useCallback(() => {
    setAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, []);

  const prevSlide = React.useCallback(() => {
    setAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, []);

  const goToSlide = React.useCallback((index: number) => {
    if (index === currentIndex) return;
    setAnimating(true);
    setCurrentIndex(index);
    setProgress(0);
  }, [currentIndex]);

  // Autoplay and progress bar ticker
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

  // Synchronize text animation transitions
  React.useEffect(() => {
    if (currentIndex === displayIndex) return;

    const timeout = setTimeout(() => {
      setDisplayIndex(currentIndex);
      setAnimating(false);
    }, 450);

    return () => clearTimeout(timeout);
  }, [currentIndex, displayIndex]);

  // Keyboard navigation (Left / Right arrow keys)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const currentSlide = slides[displayIndex];

  return (
    <section
      className="home-banner-v2 luxury-hero-section"
      aria-label="Clinic introduction"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Fullscreen Fixed Slideshow Wallpaper */}
      <div className="wallpaper" aria-hidden="true">
        <div className="media-box">
          {slides.map((slide, i) => (
            <div
              key={slide.image}
              className={`hero-slide-item ${i === currentIndex ? "active" : ""}`}
            >
              <img
                className="hero-slide-img"
                src={slide.image}
                alt=""
              />
            </div>
          ))}
          <div className="hero-cinematic-overlay" />
        </div>
      </div>

      {/* 2. Floating Left / Right Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="hero-nav-arrow hero-nav-prev"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="hero-nav-arrow hero-nav-next"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 3. Center Hero Editorial Content */}
      <div className="container hero-center-container">
        <div className="hero-content-wrapper">
          {/* Kicker Trust Pill */}
          <div className="hero-kicker-pill" aria-label="Care philosophy">
            <ShieldCheck className="hero-kicker-sparkle" aria-hidden="true" />
            <span className="hero-kicker-text">{currentSlide.kicker}</span>
            <span className="hero-kicker-dot" aria-hidden="true" />
            <strong className="hero-kicker-badge">{currentSlide.badge}</strong>
          </div>

          {/* Headline and Supporting Copy */}
          <div className={`hero-headline-block ${animating ? "slide-anim-out" : "slide-anim-in"}`}>
            <h1 className="hero-display-title">
              <span className="title-lead">{currentSlide.sloganFirst}</span>
              <i className="title-accent font-serif">{currentSlide.sloganSecond}</i>
            </h1>
            <p className="hero-editorial-desc">{currentSlide.description}</p>
          </div>

          {/* Dual Action CTAs */}
          <div className="hero-cta-group">
            <Link href="/book" className="hero-btn-primary">
              <CalendarDays className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Book a Consultation</span>
            </Link>
            <Link href="/services" className="hero-btn-secondary">
              <span>Explore Treatments</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Quick Feature Pills */}
          <div className="hero-trust-chips" aria-label="Key highlights">
            {currentSlide.features.map((feat, idx) => (
              <div key={idx} className="hero-trust-chip">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9CB080]" aria-hidden="true" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating Slide Controller & Progress Strip */}
      <div className="hero-bottom-controller" aria-label="Slide navigation">
        <div className="hero-controller-pill">
          {/* Slide Counter */}
          <div className="hero-counter-wrap">
            <span className="hero-counter-current">{String(currentIndex + 1).padStart(2, "0")}</span>
            <span className="hero-counter-divider">/</span>
            <span className="hero-counter-total">{String(slides.length).padStart(2, "0")}</span>
          </div>

          {/* Interactive Slide Selector Pills */}
          <div className="hero-pills-list">
            {slides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                className={`hero-selector-pill ${i === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}: ${slide.sloganFirst} ${slide.sloganSecond}`}
              >
                {i === currentIndex && (
                  <span
                    className="hero-pill-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Active Tag Label */}
          <div className="hero-controller-tag hidden md:flex">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9CB080] mr-1.5" />
            <span>{currentSlide.badge}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
