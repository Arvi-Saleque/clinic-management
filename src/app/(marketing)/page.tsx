import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { LuxuryHero } from "@/components/marketing/luxury-hero";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { LuxuryRoadmap } from "@/components/marketing/luxury-roadmap";
import { LuxuryWhyChoose } from "@/components/marketing/luxury-why-choose";
import { LuxurySmileSimulator } from "@/components/marketing/luxury-smile-simulator";
import { BeforeAfterSlider } from "@/components/marketing/luxury-before-after";
import { LuxuryFaq } from "@/components/marketing/luxury-faq";
import { HomepageMotion } from "@/components/marketing/homepage-motion";

export default function HomePage() {
  return (
    <div className="home luxury-homepage-root">
      <HomepageMotion />
      {/* 1. Hero Slideshow */}
      <LuxuryHero />

      {/* 2. Dark Content Wrapper */}
      <div className="content-dark-wrapper">
        {/* White Rounded Container 1 — Founder story / value proposition */}
        <div className="page-section-white first-card">
          <section className="text-image-groups" id="story">
            <div className="container">
              <div className="wrapper">
                <div className="scroll-view-item">
                  <div className="text-image single">
                    <div className="content">
                      <div className="text-box">
                        <span className="subtitle-italic">Welcome to Clinic Care Dental</span>
                        <h2 className="h3" data-motion-split="true">Your smile tells your story — and we showcase it beautifully.</h2>
                        <p>
                          We combine digital treatment planning, careful clinical assessment, and personalised restorative and cosmetic care to create treatment plans built around each patient.
                        </p>
                        <p>
                          From your first enquiry, our aim is to make each step clear, considered, and comfortable — with time to understand your options before you decide how to proceed.
                        </p>
                        <div className="btn-group">
                          <Link href="/book" className="btn">
                            <CalendarDays className="w-4 h-4 mr-2 inline" />
                            Book Online
                          </Link>
                          <Link href="/about" className="btn-stroke">
                            About Our Clinic
                          </Link>
                        </div>
                      </div>

                      <div className="img-box">
                        <Card3D className="img-item motion-low-tilt-card" maxTilt={3} glare={false}>
                          <img
                            src="/marketing/demo_dental_team.png"
                            alt="Professional Dental Clinic Team"
                            className="rounded-2xl shadow-xl"
                          />
                        </Card3D>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 3. 4-Step 3D Smile Transformation Roadmap Protocol */}
        <LuxuryRoadmap />

        {/* White Rounded Container 2 — treatments & why choose stacking cards */}
        <div className="page-section-white second-card">
          {/* 4 Columns Treatment Grid Showcase */}
          <section className="four-columns-card" id="treatments">
            <div className="container">
              <div className="wrapper">
                <div className="content">
                  <div className="title-box text-center">
                    <span className="subtitle-italic">Care, planned around you</span>
                    <h2 className="h3" data-motion-split="true">Our Dental Treatments</h2>
                    <div className="divider-line" />
                  </div>

                  <div className="treatment-grid-list">
                    {/* Grid item 1: Dental Implants */}
                    <Link href="/services" className="treatment-card-item">
                      <div className="card-bg-box">
                        <img
                          src="/marketing/hero_implant.png"
                          alt="Dental Implants"
                        />
                      </div>
                      <div className="card-overlay-content">
                        <div className="treatment-icon">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="card-title">Dental Implants</h3>
                        <p className="card-desc">
                          Implant-based options for replacing missing teeth, planned around your clinical needs and restorative goals.
                        </p>
                        <span className="card-readmore">
                          <span>Read more</span>
                          <span className="readmore-arrow">→</span>
                        </span>
                      </div>
                    </Link>

                    {/* Grid item 2: Veneers */}
                    <Link href="/services" className="treatment-card-item">
                      <div className="card-bg-box">
                        <img
                          src="/marketing/ceramist_artistry.jpg"
                          alt="Porcelain Veneers"
                        />
                      </div>
                      <div className="card-overlay-content">
                        <div className="treatment-icon">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="card-title">Veneers</h3>
                        <p className="card-desc">
                          Porcelain restorations designed to refine tooth shape, proportion, colour, and overall smile balance where clinically suitable.
                        </p>
                        <span className="card-readmore">
                          <span>Read more</span>
                          <span className="readmore-arrow">→</span>
                        </span>
                      </div>
                    </Link>

                    {/* Grid item 3: Cosmetic Braces & Invisalign */}
                    <Link href="/services" className="treatment-card-item">
                      <div className="card-bg-box">
                        <img
                          src="/marketing/hero_aligners.png"
                          alt="Cosmetic Braces & Invisalign"
                        />
                      </div>
                      <div className="card-overlay-content">
                        <div className="treatment-icon">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="card-title">Cosmetic Braces</h3>
                        <p className="card-desc">
                          Clear-aligner and discreet orthodontic options designed to improve alignment with a plan tailored to your bite and smile goals.
                        </p>
                        <span className="card-readmore">
                          <span>Read more</span>
                          <span className="readmore-arrow">→</span>
                        </span>
                      </div>
                    </Link>

                    {/* Grid item 4: Laser Teeth Whitening */}
                    <Link href="/services" className="treatment-card-item">
                      <div className="card-bg-box">
                        <img
                          src="/marketing/hero_smile.png"
                          alt="Teeth Whitening"
                        />
                      </div>
                      <div className="card-overlay-content">
                        <div className="treatment-icon">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="card-title">Teeth Whitening</h3>
                        <p className="card-desc">
                          Professional whitening options planned around your oral health, goals, and preferred shade direction.
                        </p>
                        <span className="card-readmore">
                          <span>Read more</span>
                          <span className="readmore-arrow">→</span>
                        </span>
                      </div>
                    </Link>
                  </div>

                  <div className="btn-row text-center mt-10">
                    <Link href="/services" className="btn treatment-view-all-cta">
                      <span>View all treatments</span>
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose — Scroll-Driven Stacking Cards */}
          <LuxuryWhyChoose />
        </div>
      </div>

      {/* 4. Interactive 3D Smile Simulator Component */}
      <LuxurySmileSimulator />

      {/* 5. Interactive Before & After Transformation Slider Section */}
      <section className="home-before-after-section" id="results">
        <div className="container">
          <div className="title-box text-center max-w-2xl mx-auto mb-12">
            <span className="subtitle-italic">Smile Transformation Showcase</span>
            <h2 className="h3" data-motion-split="true">Interactive Before &amp; After Preview</h2>
            <p className="home-section-copy">
              Drag the slider to compare treatment imagery and explore the type of changes that may be discussed during consultation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeImage="/marketing/veneers_before.jpg"
              afterImage="/marketing/veneers_after.jpg"
              title="Cosmetic Veneers Makeover"
              subtitle="Illustrative cosmetic case preview"
            />
            <BeforeAfterSlider
              beforeImage="/marketing/implants_before.jpg"
              afterImage="/marketing/implants_after.jpg"
              title="Full Arch Restorative Makeover"
              subtitle="Illustrative restorative case preview"
            />
          </div>

          <div className="text-center mt-10">
            <Link href="/results" className="btn">
              Explore Smile Gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Marquee Banner */}
      <section className="marquee-text">
        <div className="marquee-row">
          <h2>
            Your <i>journey,</i> your pace, your smile. &nbsp;&nbsp;&nbsp;&nbsp; Your <i>journey,</i> your pace, your
            smile. &nbsp;&nbsp;&nbsp;&nbsp; Your <i>journey,</i> your pace, your smile.
          </h2>
          <h2>
            Your <i>journey,</i> your pace, your smile. &nbsp;&nbsp;&nbsp;&nbsp; Your <i>journey,</i> your pace, your
            smile. &nbsp;&nbsp;&nbsp;&nbsp; Your <i>journey,</i> your pace, your smile.
          </h2>
        </div>
      </section>

      {/* 7. Pricing Guide & Payment Plans Card Banner */}
      <section className="price-guide">
        <div className="container">
          <div className="content">
            <div className="text-box">
              <span className="price-guide-kicker">Treatment planning with clarity</span>
              <h2 className="h3" data-motion-split="true">Flexible Payment Options</h2>
              <p>
                We believe high-quality dental care should be accessible and transparent. Ask our team about available payment options and whether suitable treatment can be arranged in planned stages.
              </p>
              <div className="btn-group">
                <Link href="/book" className="btn-download">
                  Enquire with our team
                </Link>
              </div>
            </div>
            <div className="img-box">
              <Card3D className="motion-low-tilt-card" maxTilt={3} glare={false}>
                <img
                  src="/marketing/hero_clinic.png"
                  alt="Patient discussing pricing with smile coordinator"
                  className="rounded-2xl shadow-lg w-full object-cover"
                />
              </Card3D>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions Section */}
      <LuxuryFaq />
    </div>
  );
}
