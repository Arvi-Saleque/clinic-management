"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Sparkles } from "lucide-react";

interface Slide {
  image: string;
  sloganFirst: string;
  sloganSecond: string;
  description: string;
}

const slides: Slide[] = [
  {
    image: "/marketing/hero_clinic.png",
    sloganFirst: "Dentistry. ",
    sloganSecond: "Reimagined.",
    description: "Modern general and cosmetic dental care with a focus on precision, comfort, and personalised treatment planning.",
  },
  {
    image: "/marketing/hero_smile.png",
    sloganFirst: "Your Smile. ",
    sloganSecond: "Our Focus.",
    description: "Thoughtful cosmetic treatment planning designed around your goals, facial features, and long-term oral health.",
  },
  {
    image: "/marketing/hero_dentist.png",
    sloganFirst: "Comfort. ",
    sloganSecond: "Care. Trust.",
    description: "Providing gentle and relaxing dental care for a calm, comfortable visit from consultation through follow-up.",
  },
  {
    image: "/marketing/hero_implant.png",
    sloganFirst: "Precision. ",
    sloganSecond: "Restored.",
    description: "Digitally planned restorative and implant care designed to support function, stability, and natural-looking results.",
  },
  {
    image: "/marketing/hero_aligners.png",
    sloganFirst: "Clarity. ",
    sloganSecond: "Confidence.",
    description: "Clear-aligner treatment planned with transparent guidance, realistic expectations, and ongoing clinical review.",
  },
];

export function LuxuryHero() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const [displayIndex, setDisplayIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (currentIndex === displayIndex) return;

    const timeout = setTimeout(() => {
      setDisplayIndex(currentIndex);
      setAnimating(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentIndex, displayIndex]);

  return (
    <section className="home-banner-v2" aria-label="Clinic introduction">
      <div className="wallpaper" aria-hidden="true">
        <div className="media-box">
          {slides.map((slide, i) => (
            <img
              key={slide.image}
              className={`hero-slide-img ${i === currentIndex ? "active" : ""}`}
              src={slide.image}
              alt=""
            />
          ))}
        </div>
      </div>

      <div className="container">
        <div className="content">
          <div className="rating-row" aria-label="Patient-focused dental care">
            <Sparkles className="hero-trust-icon" aria-hidden="true" />
            <span className="hero-trust-label">Patient-focused dentistry</span>
            <span className="hero-trust-divider" aria-hidden="true" />
            <strong className="hero-trust-value">Comfort · Clarity · Precision</strong>
          </div>

          <div className={`hero-text-content ${animating ? "fade-out" : "fade-in"}`}>
            <p className="h1">
              {slides[displayIndex].sloganFirst}
              <i>{slides[displayIndex].sloganSecond}</i>
            </p>
            <h1 className="heading-desc">{slides[displayIndex].description}</h1>
          </div>

          <div className="btn-row">
            <Link href="/book" className="hero-primary-cta">
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              Book Online
            </Link>
            <Link href="/services" className="hero-secondary-cta">
              Explore Treatments
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-dots" aria-label="Hero slides">
            {slides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                className={`hero-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => {
                  setAnimating(true);
                  setCurrentIndex(i);
                }}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
