import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { BeforeAfterSlider } from "@/components/marketing/luxury-before-after";

export const metadata: Metadata = {
  title: "Smile Results & Gallery | Clinic Care Dental",
  description: "Browse before and after results of porcelain veneers, dental implants, Invisalign, and teeth whitening makeovers.",
};

const smileCases = [
  {
    id: 1,
    title: "Upper Porcelain Veneer Case",
    category: "Cosmetic Veneers",
    concern: "Uneven spacing, minor incisal edge wear, and yellowish enamel shading",
    solution: "10 bespoke custom-layered porcelain veneers in shade BL2 with natural micro-texture",
    beforeImg: "/marketing/veneers_before.jpg",
    afterImg: "/marketing/veneers_after.jpg",
    duration: "2 Appointments",
  },
  {
    id: 2,
    title: "Full-Arch Implant Restoration",
    category: "Dental Implants",
    concern: "Multiple missing teeth, failing restorations, and compromised chewing function",
    solution: "Computer-guided implant bridge with custom permanent monolithic zirconia arch",
    beforeImg: "/marketing/implants_before.jpg",
    afterImg: "/marketing/implants_after.jpg",
    duration: "Phased Treatment",
  },
  {
    id: 3,
    title: "Clear Aligner Smile Alignment",
    category: "Orthodontics",
    concern: "Moderate anterior crowding, overlapping incisors, and narrow smile arch",
    solution: "Invisalign clear aligners followed by gentle cosmetic enamel contouring and whitening",
    beforeImg: "/marketing/invisalign_before.jpg",
    afterImg: "/marketing/invisalign_after.jpg",
    duration: "8 Months",
  },
  {
    id: 4,
    title: "Professional In-Chair Laser Whitening",
    category: "Teeth Whitening",
    concern: "Deep coffee, tea, and lifestyle enamel staining prior to special occasion",
    solution: "Single in-chair laser whitening session yielding noticeable multi-shade brightness lift",
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
        <section className="page-hero-banner py-20 text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            {/* Breadcrumb Route (Dhaka Heights style) */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
              <ol className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
                <li>
                  <Link href="/" className="hover:text-white transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li className="text-[#9CB080]" aria-hidden="true">›</li>
                <li className="text-[#9CB080] font-bold" aria-current="page">
                  Results
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smile Treatment Showcase</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Treatment Possibilities. <br />
              <i className="font-serif text-[#9CB080]">Thoughtfully Presented.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Explore before-and-after treatment examples using the interactive sliders below. Individual suitability and outcomes vary.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Results Gallery Section */}
        <section className="gallery-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
              {smileCases.map((c) => (
                <div
                  key={c.id}
                  className="case-card-wrapper group bg-white rounded-[32px] p-6 sm:p-8 border border-[#273338]/10 shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_50px_-10px_rgba(43,87,72,0.22)] hover:border-[#9CB080]/60 transition-all duration-500 flex flex-col justify-between"
                >
                  <div>
                    {/* Header category pill & title */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#2B5748]/08 text-[#2B5748] px-3 py-1 rounded-full border border-[#2B5748]/12">
                        {c.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#52605B] font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#2B5748]" />
                        <span>{c.duration}</span>
                      </div>
                    </div>

                    <div className="rounded-[24px] overflow-hidden border border-[#273338]/08 shadow-sm">
                      <BeforeAfterSlider
                        beforeImage={c.beforeImg}
                        afterImage={c.afterImg}
                        title={c.title}
                        subtitle={`Treatment Duration: ${c.duration}`}
                      />
                    </div>

                    {/* Case Concerns & Clinical Solutions */}
                    <div className="mt-6 pt-5 border-t border-[#273338]/08 space-y-3">
                      <div className="p-3.5 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06">
                        <div className="text-xs font-bold text-[#182320] mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E58A40]" />
                          <span>Clinical Concern:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#52605B] leading-relaxed pl-3.5">
                          {c.concern}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#2B5748]/05 border border-[#2B5748]/12">
                        <div className="text-xs font-bold text-[#2B5748] mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2B5748]" />
                          <span>Clinical Solution:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#273338] font-medium leading-relaxed pl-5">
                          {c.solution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Inquire Action */}
                  <div className="mt-6 pt-4 border-t border-[#273338]/08 flex items-center justify-between gap-3">
                    <span className="text-xs text-[#7A8681] italic">
                      Individual results may vary
                    </span>

                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2B5748]/08 hover:bg-[#2B5748] text-[#2B5748] hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[#2B5748]/15 hover:border-transparent transition-all duration-300 hover:scale-105"
                    >
                      <span>Consult on Treatment</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#414a4c]/70 text-center italic mt-14 max-w-2xl mx-auto leading-relaxed">
              *Individual results vary based on oral anatomy, clinical health, and treatment plan. Suitability and expected outcomes are confirmed during an in-person assessment.
            </p>
          </div>
        </section>

        {/* Results Bottom CTA Section */}
        <section className="results-cta relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Bespoke Smile Design</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                Ready to Begin Your <br className="hidden sm:inline" />
                <i className="font-serif text-[#B5C89B]">Smile Transformation?</i>
              </h2>

              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                Schedule a personalized consultation and 3D digital smile scan with our experienced clinical team today.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider !text-white text-white shadow-[0_8px_24px_rgba(43,87,72,0.4)] hover:shadow-[0_12px_32px_rgba(43,87,72,0.6)] transition-all duration-300 hover:scale-105 border border-[#9CB080]/30"
                  style={{ color: '#ffffff' }}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Book Consultation Online</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-8 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider !text-white text-white border border-white/25 hover:border-white/50 backdrop-blur-md transition-all duration-300 hover:scale-105"
                  style={{ color: '#ffffff' }}
                >
                  <span>Contact Our Clinic</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
