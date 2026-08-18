"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

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

  React.useEffect(() => {
    // Warm the modules so the first FLIP interaction feels immediate.
    void Promise.all([import("gsap"), import("gsap/Flip")]);
    return () => {
      if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    };
  }, []);

  const handleSimulate = React.useCallback(() => {
    if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    setIsSimulating(true);
    simulateTimerRef.current = setTimeout(() => setIsSimulating(false), 420);
  }, []);

  const flipSelection = React.useCallback(
    async (selector: string, update: () => void) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        update();
        handleSimulate();
        return;
      }

      const [gsapModule, flipModule] = await Promise.all([import("gsap"), import("gsap/Flip")]);
      const { gsap } = gsapModule;
      const { Flip } = flipModule;
      gsap.registerPlugin(Flip);

      const current = document.querySelector<HTMLElement>(selector);
      const state = current ? Flip.getState(current) : null;

      flushSync(update);
      const next = document.querySelector<HTMLElement>(selector);

      if (state && next) {
        Flip.from(state, {
          targets: next,
          absolute: true,
          scale: true,
          duration: 0.55,
          ease: "power3.out",
        });
      } else if (next) {
        gsap.fromTo(next, { opacity: 0.2, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" });
      }

      handleSimulate();
    },
    [handleSimulate]
  );

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
          <div className="simulator-display-col">
            <div className={`simulator-3d-card ${isSimulating ? "pulse-anim" : ""}`}>
              <div className="simulator-screen">
                <div className="badge-3d-tag">Illustrative Smile Preview</div>
                <div className="scan-line" aria-hidden="true" />
                <img key={currentImage} src={currentImage} alt="Illustrative smile preview" className="preview-image" />

                <div className="hud-overlay">
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

          <div className="simulator-controls-col">
            <span className="subtitle-italic">Digital Smile Preview</span>
            <h2 className="h3" data-motion-split="true">Explore Your Smile Preferences</h2>
            <p className="controls-intro">
              Use this illustrative configurator to explore aesthetic preferences before a consultation. It is not a diagnosis or a prediction of your clinical result.
            </p>

            <div className="control-group">
              <span className="control-title">1. Treatment Interest</span>
              <div className="pills-grid">
                {options.treatment.map((t) => {
                  const active = selectedTreatment === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`pill-btn ${active ? "active" : ""}`}
                      onClick={() => {
                        if (active) return;
                        void flipSelection(".treatment-selection-outline", () => setSelectedTreatment(t.id));
                      }}
                      aria-pressed={active}
                    >
                      {active && (
                        <span
                          className="simulator-selection-outline treatment-selection-outline"
                          data-flip-id="simulator-treatment-outline"
                          aria-hidden="true"
                        />
                      )}
                      <span className="pill-name">{t.name}</span>
                      <span className="pill-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="control-group">
              <span className="control-title">2. Shade Preference</span>
              <div className="shades-row">
                {options.shade.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`shade-circle-btn ${selectedShade === s.id ? "active" : ""}`}
                    onClick={() => {
                      if (selectedShade === s.id) return;
                      setSelectedShade(s.id);
                      handleSimulate();
                    }}
                    title={s.name}
                    aria-label={s.name}
                    aria-pressed={selectedShade === s.id}
                  >
                    <span className="color-swatch" style={{ backgroundColor: s.color }} />
                    <span className="shade-code">{s.id.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-title">3. Smile Contour</span>
              <div className="shapes-grid">
                {options.shape.map((sh) => {
                  const active = selectedShape === sh.id;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      className={`shape-btn ${active ? "active" : ""}`}
                      onClick={() => {
                        if (active) return;
                        void flipSelection(".shape-selection-outline", () => setSelectedShape(sh.id));
                      }}
                      aria-pressed={active}
                    >
                      {active && (
                        <span
                          className="simulator-selection-outline shape-selection-outline"
                          data-flip-id="simulator-shape-outline"
                          aria-hidden="true"
                        />
                      )}
                      <strong>{sh.name}</strong>
                      <span>{sh.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="simulator-action-box">
              <Link href="/book" className="btn-blue simulator-book-cta">
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
                Book a Smile Consultation
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
