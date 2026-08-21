"use client";

import * as React from "react";
import Link from "next/link";
import { Card3D } from "./luxury-card3d";
import { Layers, Scan, ShieldCheck, Wand2, CalendarDays } from "lucide-react";
import { LuxuryMotionMark } from "./luxury-motion-mark";

interface StepItem {
  step: string;
  title: string;
  tag: string;
  icon: React.ReactNode;
  description: string;
  metric: string;
}

const steps: StepItem[] = [
  {
    step: "01",
    title: "Digital Scan & Smile Planning",
    tag: "Precision-Led Planning",
    icon: <Scan className="w-7 h-7" />,
    description:
      "Digital scans and clinical photography help your dentist assess your smile, discuss suitable options, and plan treatment around your individual goals.",
    metric: "Digital Planning",
  },
  {
    step: "02",
    title: "Trial Smile & Collaborative Review",
    tag: "Preview Before Finalising",
    icon: <Wand2 className="w-7 h-7" />,
    description:
      "Where appropriate, a trial or visual preview can help you discuss proportions, shape, and aesthetics before the final treatment plan is confirmed.",
    metric: "Patient-Led Review",
  },
  {
    step: "03",
    title: "Bespoke Ceramic Restorations",
    tag: "Natural Aesthetics",
    icon: <Layers className="w-7 h-7" />,
    description:
      "When ceramic restorations are suitable, design details such as contour, shade, and translucency are planned to complement your smile and clinical needs.",
    metric: "Bespoke Design",
  },
  {
    step: "04",
    title: "Comfort-Focused Care & Final Review",
    tag: "Calm, Supported Visits",
    icon: <ShieldCheck className="w-7 h-7" />,
    description:
      "Treatment is delivered with clear communication, gentle techniques, and time for questions, followed by review and aftercare guidance tailored to you.",
    metric: "Comfort-Focused Care",
  },
];

export function LuxuryRoadmap() {
  const [activeStep, setActiveStep] = React.useState(0);

  return (
    <section className="smile-journey-section" id="journey">
      <div className="journey-ambient-backdrop" aria-hidden="true">
        <div className="journey-bg-fixed" />
        <div className="journey-ambient-glow-primary" />
        <div className="journey-ambient-glow-secondary" />
        <div className="journey-ambient-mesh" />
      </div>

      <div className="container">
        <div className="journey-header">
          <div className="header-badge-dark">
            <CalendarDays className="sparkle-icon w-3.5 h-3.5" aria-hidden="true" />
            <span>Your Treatment Journey</span>
          </div>
          <LuxuryMotionMark />
          <h2 className="h2 journey-title" data-motion-split="true">
            Thoughtful planning for a <br />
            <i>smile that feels like you</i>
          </h2>
          <p className="journey-subtitle">
            A clear four-stage approach that keeps consultation, planning, comfort, and aftercare connected from the start.
          </p>
        </div>

        <div className="journey-grid-4">
          {steps.map((item, idx) => (
            <Card3D
              key={item.step}
              className={`journey-step-card ${activeStep === idx ? "active-step" : ""}`}
              maxTilt={4}
              glare={false}
              onClick={() => setActiveStep(idx)}
            >
              <div className="step-top-row">
                <span className="step-number-pill">{item.step}</span>
                <span className="step-metric-tag">{item.metric}</span>
              </div>

              <div className="step-icon-wrapper">{item.icon}</div>

              <div className="step-content-body">
                <span className="step-tagline">{item.tag}</span>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>

              <div className="step-bottom-glow" />
            </Card3D>
          ))}
        </div>

        <div className="journey-trust-bar">
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <span className="trust-label">Clear Treatment Explanations</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <span className="trust-label">Flexible Payment Options</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <span className="trust-label">Personalised Follow-Up Support</span>
          </div>

          <Link href="/book" className="btn-blue journey-book-cta">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            Start Your Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
