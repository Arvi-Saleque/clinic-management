"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import gsap from "gsap";

const options = {
  treatment: [
    { id: "veneers", name: "Porcelain Veneers", desc: "Explore a ceramic-restoration aesthetic with balanced shape and tone." },
    { id: "whitening", name: "Professional Whitening", desc: "Preview a brighter shade direction for discussion during consultation." },
    { id: "invisalign", name: "Clear Aligners", desc: "Explore how a straighter smile line may change overall balance." },
    { id: "implants", name: "Implant Restorations", desc: "Preview restorative aesthetics for areas affected by missing teeth." },
  ],
  shade: [
    { id: "bl1", name: "BL1 - Bright White", color: "#FDFCFA" },
    { id: "bl2", name: "BL2 - Soft White", color: "#F7F6F1" },
    { id: "a1", name: "A1 - Warm Pearl", color: "#F1EEE3" },
    { id: "a2", name: "A2 - Warm Ivory", color: "#EBE6D8" },
  ],
  shape: [
    { id: "hollywood", name: "Defined", desc: "Straighter edges with a more structured visual profile." },
    { id: "natural", name: "Natural Soft", desc: "Balanced contours with a softer, understated appearance." },
    { id: "youthful", name: "Soft Oval", desc: "Rounded contours with slightly more curved edges." },
  ],
};

export function LuxurySmileSimulator() {
  const [selectedTreatment, setSelectedTreatment] = React.useState("veneers");
  const [selectedShade, setSelectedShade] = React.useState("bl2");
  const [selectedShape, setSelectedShape] = React.useState("natural");
  const [isSimulating, setIsSimulating] = React.useState(false);
  const simulateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewImageRef = React.useRef<HTMLImageElement | null>(null);
  const hudOverlayRef = React.useRef<HTMLDivElement | null>(null);
  const ctaButtonRef = React.useRef<HTMLAnchorElement | null>(null);

  // Option Group Containers
  const treatmentGroupRef = React.useRef<HTMLDivElement | null>(null);
  const shadeGroupRef = React.useRef<HTMLDivElement | null>(null);
  const shapeGroupRef = React.useRef<HTMLDivElement | null>(null);

  // Option Group Animated Frames
  const treatmentFrameRef = React.useRef<HTMLDivElement | null>(null);
  const shadeFrameRef = React.useRef<HTMLDivElement | null>(null);
  const shapeFrameRef = React.useRef<HTMLDivElement | null>(null);

  // Calculate and animate selection frame geometry relative to group container
  const positionFrame = React.useCallback(
    (
      container: HTMLElement | null,
      frame: HTMLElement | null,
      activeSelector: string,
      immediate = false
    ) => {
      if (!container || !frame) return;
      const activeEl = container.querySelector<HTMLElement>(activeSelector);
      if (!activeEl) {
        gsap.set(frame, { opacity: 0 });
        return;
      }

      const left = activeEl.offsetLeft;
      const top = activeEl.offsetTop;
      const width = activeEl.offsetWidth;
      const height = activeEl.offsetHeight;
      const borderRadius = window.getComputedStyle(activeEl).borderRadius || "12px";

      if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(frame, {
          x: left,
          y: top,
          width,
          height,
          borderRadius,
          opacity: 1,
        });
      } else {
        gsap.to(frame, {
          x: left,
          y: top,
          width,
          height,
          borderRadius,
          opacity: 1,
          duration: 0.32,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    },
    []
  );

  // Subtle visual feedback on preview image and HUD upon selection change
  const triggerPreviewFeedback = React.useCallback((hudIndex?: number) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    setIsSimulating(true);
    simulateTimerRef.current = setTimeout(() => setIsSimulating(false), 380);

    if (previewImageRef.current) {
      gsap.fromTo(
        previewImageRef.current,
        { scale: 0.988, opacity: 0.82 },
        { scale: 1, opacity: 1, duration: 0.32, ease: "power2.out" }
      );
    }

    if (hudOverlayRef.current && typeof hudIndex === "number") {
      const hudItems = hudOverlayRef.current.querySelectorAll(".hud-item");
      const targetItem = hudItems[hudIndex];
      if (targetItem) {
        gsap.fromTo(
          targetItem,
          { y: -3, opacity: 0.6 },
          { y: 0, opacity: 1, duration: 0.26, ease: "power2.out" }
        );
      }
    }
  }, []);

  // Update frames on state changes
  React.useEffect(() => {
    positionFrame(
      treatmentGroupRef.current,
      treatmentFrameRef.current,
      `[data-treatment-id="${selectedTreatment}"]`
    );
  }, [selectedTreatment, positionFrame]);

  React.useEffect(() => {
    positionFrame(
      shadeGroupRef.current,
      shadeFrameRef.current,
      `[data-shade-id="${selectedShade}"]`
    );
  }, [selectedShade, positionFrame]);

  React.useEffect(() => {
    positionFrame(
      shapeGroupRef.current,
      shapeFrameRef.current,
      `[data-shape-id="${selectedShape}"]`
    );
  }, [selectedShape, positionFrame]);

  // Initial positioning & resize listener
  React.useEffect(() => {
    const handleResize = () => {
      positionFrame(
        treatmentGroupRef.current,
        treatmentFrameRef.current,
        `[data-treatment-id="${selectedTreatment}"]`,
        true
      );
      positionFrame(
        shadeGroupRef.current,
        shadeFrameRef.current,
        `[data-shade-id="${selectedShade}"]`,
        true
      );
      positionFrame(
        shapeGroupRef.current,
        shapeFrameRef.current,
        `[data-shape-id="${selectedShape}"]`,
        true
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    };
  }, [positionFrame, selectedTreatment, selectedShade, selectedShape]);

  // Handlers
  const handleSelectTreatment = (id: string) => {
    if (id === selectedTreatment) return;
    setSelectedTreatment(id);
    triggerPreviewFeedback(0);
  };

  const handleSelectShade = (id: string) => {
    if (id === selectedShade) return;
    setSelectedShade(id);
    triggerPreviewFeedback(1);
  };

  const handleSelectShape = (id: string) => {
    if (id === selectedShape) return;
    setSelectedShape(id);
    triggerPreviewFeedback(2);
  };

  // Magnetic CTA microinteraction on desktop fine-pointer devices
  const handleCtaMouseMove = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      !window.matchMedia("(pointer: fine) and (min-width: 1025px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const btn = ctaButtonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const maxMove = 5;
    const moveX = (x / (rect.width / 2)) * maxMove;
    const moveY = (y / (rect.height / 2)) * maxMove;

    gsap.to(btn, {
      x: moveX,
      y: moveY,
      duration: 0.25,
      ease: "power2.out",
    });
    const icon = btn.querySelector("svg");
    if (icon) {
      gsap.to(icon, {
        x: moveX * 1.4,
        y: moveY * 1.4,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  }, []);

  const handleCtaMouseLeave = React.useCallback(() => {
    const btn = ctaButtonRef.current;
    if (!btn) return;

    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.4,
      ease: "power3.out",
    });
    const icon = btn.querySelector("svg");
    if (icon) {
      gsap.to(icon, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }
  }, []);

  const currentImage =
    selectedTreatment === "veneers"
      ? "/marketing/veneers_after.jpg"
      : selectedTreatment === "implants"
      ? "/marketing/implants_after.jpg"
      : selectedTreatment === "invisalign"
      ? "/marketing/invisalign_after.jpg"
      : "/marketing/whitening_after.jpg";

  const selectedTreatmentName = options.treatment.find((t) => t.id === selectedTreatment)?.name;
  const selectedShadeOption = options.shade.find((s) => s.id === selectedShade);
  const selectedShapeName = options.shape.find((s) => s.id === selectedShape)?.name;

  return (
    <section className="smile-simulator-section" id="smile-simulator">
      <div className="container">
        <div className="simulator-grid">
          {/* Left: Preview Panel */}
          <div className="simulator-display-col">
            <div className={`simulator-3d-card ${isSimulating ? "pulse-anim" : ""}`}>
              <div className="simulator-screen">
                <div className="badge-3d-tag">Illustrative Smile Preview</div>
                <div className="scan-line" aria-hidden="true" />
                <img
                  ref={previewImageRef}
                  key={currentImage}
                  src={currentImage}
                  alt="Illustrative smile preview"
                  className="preview-image"
                />

                <div ref={hudOverlayRef} className="hud-overlay">
                  <div className="hud-item">
                    <span className="hud-label">Treatment interest</span>
                    <strong>{selectedTreatmentName}</strong>
                  </div>
                  <div className="hud-item">
                    <span className="hud-label">Shade preference</span>
                    <div className="hud-shade-indicator">
                      <span className="shade-dot" style={{ backgroundColor: selectedShadeOption?.color }} />
                      <strong>{selectedShadeOption?.name.split(" - ")[0]}</strong>
                    </div>
                  </div>
                  <div className="hud-item">
                    <span className="hud-label">Smile contour</span>
                    <strong>{selectedShapeName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls & Options */}
          <div className="simulator-controls-col">
            <span className="subtitle-italic">Digital Smile Preview</span>
            <h2 className="h3" data-motion-split="true">Explore Your Smile Preferences</h2>
            <p className="controls-intro">
              Use this illustrative configurator to explore aesthetic preferences before a consultation. It is not a diagnosis or a prediction of your clinical result.
            </p>

            {/* 1. Treatment Interest */}
            <div className="control-group">
              <span className="control-title">1. Treatment Interest</span>
              <div ref={treatmentGroupRef} className="pills-grid">
                <div
                  ref={treatmentFrameRef}
                  className="simulator-active-frame treatment-active-frame"
                  aria-hidden="true"
                />
                {options.treatment.map((t) => {
                  const active = selectedTreatment === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      data-treatment-id={t.id}
                      className={`pill-btn ${active ? "active" : ""}`}
                      onClick={() => handleSelectTreatment(t.id)}
                      aria-pressed={active}
                    >
                      <span className="pill-name">{t.name}</span>
                      <span className="pill-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Shade Preference */}
            <div className="control-group">
              <span className="control-title">2. Shade Preference</span>
              <div ref={shadeGroupRef} className="shades-row">
                <div
                  ref={shadeFrameRef}
                  className="simulator-active-frame shade-active-frame"
                  aria-hidden="true"
                />
                {options.shade.map((s) => {
                  const active = selectedShade === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-shade-id={s.id}
                      className={`shade-circle-btn ${active ? "active" : ""}`}
                      onClick={() => handleSelectShade(s.id)}
                      title={s.name}
                      aria-label={s.name}
                      aria-pressed={active}
                    >
                      <span className="color-swatch" style={{ backgroundColor: s.color }} />
                      <span className="shade-code">{s.id.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Smile Contour */}
            <div className="control-group">
              <span className="control-title">3. Smile Contour</span>
              <div ref={shapeGroupRef} className="shapes-grid">
                <div
                  ref={shapeFrameRef}
                  className="simulator-active-frame shape-active-frame"
                  aria-hidden="true"
                />
                {options.shape.map((sh) => {
                  const active = selectedShape === sh.id;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      data-shape-id={sh.id}
                      className={`shape-btn ${active ? "active" : ""}`}
                      onClick={() => handleSelectShape(sh.id)}
                      aria-pressed={active}
                    >
                      <strong>{sh.name}</strong>
                      <span>{sh.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action CTA */}
            <div className="simulator-action-box">
              <Link
                ref={ctaButtonRef}
                href="/book"
                className="btn-blue simulator-book-cta"
                onMouseMove={handleCtaMouseMove}
                onMouseLeave={handleCtaMouseLeave}
              >
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
                <span>Book a Smile Consultation</span>
              </Link>
              <p className="simulator-disclaimer">
                Illustrative visualisation only. Your dentist will assess suitability and discuss realistic treatment outcomes during consultation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
