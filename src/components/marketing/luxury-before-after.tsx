"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After Smile Makeover",
  title = "Smile Transformation",
  subtitle = "Porcelain Veneers & Alignment",
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = React.useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  React.useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div className={`before-after-card ${className}`}>
      <div className="before-after-header">
        {title && <h4>{title}</h4>}
        {subtitle && <span className="case-tag">{subtitle}</span>}
      </div>

      <div
        ref={containerRef}
        className="before-after-container"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="slider-img after-img"
          draggable="false"
        />
        <span className="badge-label badge-after">{afterLabel}</span>

        {/* Before Image (Foreground with clip path) */}
        <div
          className="before-img-wrapper"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="slider-img before-img"
            draggable="false"
          />
          <span className="badge-label badge-before">{beforeLabel}</span>
        </div>

        {/* Slider Divider Line and Handle */}
        <div className="slider-divider" style={{ left: `${sliderPosition}%` }}>
          <div className="slider-handle">
            <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
            <ChevronRight className="w-3.5 h-3.5 -ml-1" />
          </div>
        </div>
      </div>

      <div className="before-after-footer">
        <span className="instructions">Drag slider to compare transformation</span>
      </div>
    </div>
  );
}

export function LuxuryBeforeAfterGallery() {
  return (
    <section className="before-after-showcase-section" id="patient-results">
      <div className="container">
        <div className="showcase-header">
          <span className="subtitle-italic">Real Patient Transformations</span>
          <h2 className="h3">Authentic Clinical Results</h2>
          <p>
            Explore actual before &amp; after smile makeovers designed by our experienced clinical team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <BeforeAfterSlider
            beforeImage="/marketing/veneers_before.jpg"
            afterImage="/marketing/veneers_after.jpg"
            title="Handcrafted Porcelain Veneers"
            subtitle="10 Upper Units • Shade BL2"
          />
          <BeforeAfterSlider
            beforeImage="/marketing/implants_before.jpg"
            afterImage="/marketing/implants_after.jpg"
            title="All-On Implants™ Full Arch"
            subtitle="Immediate Fixed Zirconia Arch"
          />
          <BeforeAfterSlider
            beforeImage="/marketing/invisalign_before.jpg"
            afterImage="/marketing/invisalign_after.jpg"
            title="Invisalign® Clear Alignment"
            subtitle="8 Months Treatment • Zero Wires"
          />
          <BeforeAfterSlider
            beforeImage="/marketing/whitening_before.jpg"
            afterImage="/marketing/whitening_after.jpg"
            title="Medical Laser Teeth Whitening"
            subtitle="Single 60-Minute Chairside Session"
          />
        </div>

        <p className="text-xs text-white/50 text-center italic mt-8 max-w-2xl mx-auto">
          *Individual clinical results vary. All cosmetic and restorative procedures require an in-person dental consultation to determine clinical suitability.
        </p>
      </div>
    </section>
  );
}
