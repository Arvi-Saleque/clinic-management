import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { BeforeAfterSlider } from "@/components/marketing/luxury-before-after";

export const metadata: Metadata = {
  title: "Smile Results & Gallery | Clinic Care Dental",
  description: "Browse before and after results of porcelain veneers, dental implants, Invisalign, and teeth whitening makeovers.",
};

const smileCases = [
  {
    id: 1,
    title: "Upper Porcelain Veneer Example",
    concern: "Uneven spacing, minor edge wear, and yellowish enamel shading",
    solution: "10 bespoke custom-layered porcelain veneers in shade BL2 with natural symmetry",
    beforeImg: "/marketing/veneers_before.jpg",
    afterImg: "/marketing/veneers_after.jpg",
    duration: "2 Appointments",
  },
  {
    id: 2,
    title: "Full-Arch Implant Restoration Example",
    concern: "Multiple missing teeth, failing restorations, and compromised chewing function",
    solution: "Computer-guided implant bridge with custom permanent zirconia arch",
    beforeImg: "/marketing/implants_before.jpg",
    afterImg: "/marketing/implants_after.jpg",
    duration: "Phased Treatment",
  },
  {
    id: 3,
    title: "Clear Aligner Treatment Example",
    concern: "Moderate anterior crowding, overlapping incisors, and narrow smile arch",
    solution: "Invisalign clear aligners followed by gentle cosmetic enamel contouring",
    beforeImg: "/marketing/invisalign_before.jpg",
    afterImg: "/marketing/invisalign_after.jpg",
    duration: "8 Months",
  },
  {
    id: 4,
    title: "Professional In-Chair Whitening Example",
    concern: "Deep coffee and lifestyle enamel staining prior to special event",
    solution: "Single in-chair laser whitening session yielding noticeable brightness lift",
    beforeImg: "/marketing/whitening_before.jpg",
    afterImg: "/marketing/whitening_after.jpg",
    duration: "60 Minutes",
  },
];

export default function ResultsPage() {
  return (
    <div className="results-page">
      <main>
        {/* Results Hero Banner */}
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smile Treatment Showcase</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              Treatment Possibilities. <br />
              <i className="font-serif text-[#9CB080]">Thoughtfully Presented.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Explore before-and-after treatment examples using the interactive sliders below. Individual suitability and outcomes vary.
            </p>
          </div>
        </section>

        {/* Results Gallery Section */}
        <section className="gallery-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {smileCases.map((c) => (
                <div key={c.id} className="case-card-wrapper bg-white rounded-3xl p-6 border border-[#273338]/10 shadow-md">
                  <BeforeAfterSlider
                    beforeImage={c.beforeImg}
                    afterImage={c.afterImg}
                    title={c.title}
                    subtitle={`Treatment: ${c.duration}`}
                  />
                  <div className="mt-6 pt-4 border-t border-[#273338]/10 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[#273338]">Clinical Concern: </span>
                      <span className="text-[#414a4c]">{c.concern}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#2B5748]">Clinical Solution: </span>
                      <span className="text-[#414a4c]">{c.solution}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#414a4c]/70 text-center italic mt-12 max-w-2xl mx-auto">
              *Individual results vary. Treatment suitability, timing, and expected outcomes should be discussed during an in-person clinical assessment.
            </p>
          </div>
        </section>

        {/* Results CTA */}
        <section className="results-cta py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center max-w-3xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                Ready to Begin Your Smile Transformation?
              </h3>
              <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
                Schedule a consultation and 3D smile scan with our clinical team.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/book" className="btn-blue">
                  <CalendarDays className="w-4 h-4 mr-2 inline" />
                  Book Consultation Online
                </Link>
                <Link href="/contact" className="btn-stroke border-white/20 hover:border-white text-white">
                  Contact Our Clinic
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
