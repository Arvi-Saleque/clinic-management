import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles, UserCheck } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { listPublicPractitioners } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "About Us | Clinic Care Dental",
  description: "Learn about Clinic Care Dental's clinical philosophy, digital dentistry technology, and experienced practitioners.",
};

const techStack = [
  {
    title: "3D Optical Intraoral Scanning",
    desc: "Creates detailed digital impressions to support treatment planning without relying on conventional impression material for every workflow.",
  },
  {
    title: "Low-Dose 3D Cone Beam Imaging",
    desc: "Provides three-dimensional diagnostic information that can support implant assessment and treatment planning when clinically appropriate.",
  },
  {
    title: "CAD/CAM Porcelain Restorations",
    desc: "Supports digitally planned ceramic restorations with attention to fit, function, and natural appearance.",
  },
  {
    title: "Digital Smile Planning",
    desc: "Helps clinicians discuss tooth proportions, smile balance, and aesthetic goals during treatment planning.",
  },
];

export default async function AboutPage() {
  const practitioners = await listPublicPractitioners();

  return (
    <div className="about-page">
      <main>
        {/* About Hero Banner */}
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
                  About Us
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modern Clinical &amp; Aesthetic Dentistry</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Crafting Smiles with <br />
              <i className="font-serif text-[#9CB080]">Precision, Comfort &amp; Artistry.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Founded on the belief that a visit to the dentist should feel calming, transparent, and tailored to your individual wellness and aesthetic goals.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Philosophy & Origin Story */}
        <section className="story-split-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="story-content-col lg:col-span-7">
                <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Our Philosophy</span>
                <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#273338] mt-2 mb-6 tracking-tight">
                  Personalized Care Built Around You
                </h2>
                <p className="text-base sm:text-lg text-[#414a4c] leading-relaxed mb-4 font-normal">
                  At Clinic Care Dental, we combine advanced digital workflows with genuine clinician attentiveness. We take time to listen, explain every option clearly, and treat each patient with gentle precision.
                </p>
                <p className="text-base sm:text-lg text-[#414a4c] leading-relaxed mb-8 font-normal">
                  From single-tooth restorations to complete smile transformations, each treatment plan is carefully engineered for long-term health, function, and natural aesthetics.
                </p>

                <div className="values-list grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white/80 border border-[#2B5748]/10 shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm mb-3">
                      01
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Comfort-Focused Care</h4>
                      <p className="text-xs sm:text-sm text-[#414a4c] mt-1.5 leading-relaxed">
                        A serene clinic environment with gentle local anaesthesia tailored for relaxed visits.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/80 border border-[#2B5748]/10 shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm mb-3">
                      02
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Custom Restorations</h4>
                      <p className="text-xs sm:text-sm text-[#414a4c] mt-1.5 leading-relaxed">
                        High-grade medical ceramics shade-matched to your unique natural tooth colour.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/80 border border-[#2B5748]/10 shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm mb-3">
                      03
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Transparent Guidance</h4>
                      <p className="text-xs sm:text-sm text-[#414a4c] mt-1.5 leading-relaxed">
                        Clear treatment discussions so you understand the proposed care before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="story-media-col lg:col-span-5">
                <Card3D className="story-image-card">
                  <img
                    src="/marketing/demo_dental_team.png"
                    alt="Clinic Care Clinical Team"
                    className="rounded-[28px] shadow-2xl w-full object-cover aspect-[4/3] lg:aspect-[5/4]"
                  />
                </Card3D>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Digital Dental Technology Showcase */}
        <section className="tech-showcase-section py-24 bg-[#273338] text-white">
          <div className="container text-center">
            <div className="title-box max-w-3xl mx-auto mb-14">
              <span className="subtitle-italic text-[#9CB080] font-semibold text-sm">Next-Generation Technology</span>
              <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-white mt-2 mb-4 tracking-tight">
                Our Digital Dentistry Suite
              </h2>
              <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto">
                Modern digital diagnostic equipment for precise planning, patient comfort, and reliable clinical outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
              {techStack.map((tech, idx) => (
                <Card3D key={idx} className="tech-card-item p-7 rounded-3xl bg-white/[0.05] border border-white/12 backdrop-blur-md hover:border-[#9CB080]/40 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#9CB080] uppercase tracking-wider mb-3">0{idx + 1}</div>
                    <h4 className="text-lg font-medium text-white mb-2.5">{tech.title}</h4>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{tech.desc}</p>
                  </div>
                </Card3D>
              ))}
            </div>
          </div>
        </section>

        {/* Real Production Team Showcase */}
        <section className="team-section-wrapper py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="title-box text-center max-w-3xl mx-auto mb-14">
              <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Clinical Team</span>
              <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#273338] mt-2 mb-4 tracking-tight">
                Meet Our Dental Practitioners
              </h2>
              <p className="text-[#414a4c] text-sm sm:text-base max-w-2xl mx-auto">
                Experienced clinicians committed to patient-first care, aesthetic precision, and comprehensive dental health.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
              {practitioners.map((doc) => {
                const docName = (doc.profiles as { full_name?: string } | null)?.full_name || "Dental Practitioner";
                return (
                  <div key={doc.id} className="team-card bg-white rounded-3xl p-6 border border-[#273338]/10 shadow-[0_10px_30px_-5px_rgba(27,38,33,0.06)] hover:shadow-[0_20px_40px_-10px_rgba(43,87,72,0.15)] hover:border-[#9CB080]/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-muted/40 relative flex items-center justify-center">
                        {doc.photo_url ? (
                          <img src={doc.photo_url} alt={docName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-12 h-12 text-[#2B5748]/40" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-[#1F2421]">{docName}</h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#2B5748] mt-1">{doc.title || "General & Cosmetic Dentist"}</p>
                      <p className="text-xs text-[#52605B] mt-3 line-clamp-3 leading-relaxed">
                        {doc.bio || "Dedicated clinician providing individualized, gentle dental care and restorative treatments."}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#273338]/10">
                      <Link
                        href={`/practitioners/${doc.id}`}
                        className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] transition-colors"
                      >
                        <span>View Profile &amp; Availability</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link href="/practitioners" className="btn-stroke text-[#273338] border-[#273338]/30 hover:border-[#273338] px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider">
                View All Practitioners &amp; Schedules
              </Link>
            </div>
          </div>
        </section>

        {/* About Bottom CTA Section */}
        <section className="about-cta-section relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Personalized Patient Care</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                Experience Personalized Dental Care <br className="hidden sm:inline" />
                <i className="font-serif text-[#B5C89B]">Built Around You.</i>
              </h2>

              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                Schedule your appointment online or explore our modern clinic facilities, dental technologies, and bespoke treatment options.
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
