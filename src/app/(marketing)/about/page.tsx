import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, Layers, Scan, ShieldCheck, UserCheck } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { listPublicPractitioners } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "About Us | Clinic Care Dental",
  description: "Learn about Clinic Care Dental's clinical philosophy, digital dentistry technology, and experienced practitioners.",
};

const techStack = [
  {
    icon: Scan,
    badge: "Imaging & Precision",
    title: "3D Optical Intraoral Scanning",
    desc: "Creates detailed digital impressions to support treatment planning without relying on conventional impression material for every workflow.",
  },
  {
    icon: Activity,
    badge: "3D Diagnostics",
    title: "Low-Dose Cone Beam Imaging",
    desc: "Provides three-dimensional diagnostic information that can support implant assessment and treatment planning when clinically appropriate.",
  },
  {
    icon: Layers,
    badge: "Medical Ceramics",
    title: "CAD/CAM Porcelain Restorations",
    desc: "Supports digitally planned ceramic restorations with meticulous attention to fit, structural integrity, and natural appearance.",
  },
  {
    icon: ShieldCheck,
    badge: "Aesthetic Simulation",
    title: "Digital Smile Planning",
    desc: "Helps clinicians discuss tooth proportions, smile balance, and aesthetic goals with patients during treatment planning.",
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
              <ShieldCheck className="w-3.5 h-3.5" />
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

        {/* 3D Digital Dental Technology Showcase with Fixed Parallax Background */}
        <section className="tech-showcase-section relative py-28 text-white overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.16),transparent_65%)]" />

          <div className="container relative z-10 text-center">
            <div className="title-box max-w-3xl mx-auto mb-16">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/35 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Next-Generation Dental Suite</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                Our Digital Dentistry <i className="font-serif text-[#B5C89B]">Technology Suite</i>
              </h2>
              <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                State-of-the-art digital diagnostic equipment engineered for sub-millimeter precision, patient comfort, and reliable clinical outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 text-left w-full">
              {techStack.map((tech, idx) => {
                const IconComponent = tech.icon;
                return (
                  <Card3D
                    key={idx}
                    className="tech-card-item p-7 sm:p-8 rounded-[28px] bg-white/[0.06] border border-white/15 backdrop-blur-xl hover:border-[#9CB080]/50 hover:bg-white/[0.09] transition-all duration-300 flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2B5748]/80 to-[#18362B]/90 border border-[#9CB080]/30 flex items-center justify-center text-[#B5C89B] group-hover:scale-110 group-hover:border-[#9CB080] transition-all duration-300 shadow-md">
                          <IconComponent className="w-6 h-6 text-[#B5C89B]" />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-[#9CB080]/80 uppercase font-mono">
                          0{idx + 1}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-[#B5C89B] uppercase tracking-wider mb-2">
                        {tech.badge}
                      </div>

                      <h3 className="text-xl font-medium text-white mb-3 leading-snug group-hover:text-[#E8F0E2] transition-colors">
                        {tech.title}
                      </h3>

                      <p className="text-sm text-white/80 leading-relaxed font-normal">
                        {tech.desc}
                      </p>
                    </div>
                  </Card3D>
                );
              })}
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
                  <div
                    key={doc.id}
                    className="team-card group bg-white rounded-[32px] p-6 border border-[#273338]/10 shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_50px_-10px_rgba(43,87,72,0.22)] hover:border-[#9CB080]/60 transition-all duration-500 flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Container with zoom & floating badges */}
                      <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-5 bg-gradient-to-br from-[#1B2623]/05 to-[#2B5748]/10 relative flex items-center justify-center border border-[#273338]/06">
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={docName}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <UserCheck className="w-14 h-14 text-[#2B5748]/40" />
                        )}

                        {/* Subtle bottom gradient on photo */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                        {/* Floating Category / Specialty Pill */}
                        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 bg-[#14201C]/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#9CB080]/30 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9CB080] animate-pulse" />
                          <span className="text-[11px] font-semibold text-[#B5C89B] tracking-wide">
                            {doc.title ? doc.title.split(",")[0] : "Dental Specialist"}
                          </span>
                        </div>

                        {/* Verified Practitioner Badge */}
                        <div className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center text-[#2B5748]">
                          <ShieldCheck className="w-4 h-4 text-[#2B5748]" />
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-[#182320] tracking-tight group-hover:text-[#2B5748] transition-colors duration-200">
                          {docName}
                        </h3>

                        <p className="text-xs sm:text-sm font-semibold text-[#2B5748] tracking-wide">
                          {doc.title || "General & Cosmetic Dentist"}
                        </p>

                        {doc.specialties && doc.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.specialties.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[11px] bg-[#2B5748]/08 text-[#2B5748] font-medium px-2.5 py-0.5 rounded-full border border-[#2B5748]/12"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-[#52605B] pt-2 line-clamp-3 leading-relaxed font-normal">
                          {doc.bio || "Dedicated clinician providing individualized, gentle dental care and restorative treatments."}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-5 mt-6 border-t border-[#273338]/08 flex items-center justify-between gap-3">
                      <Link
                        href={`/practitioners/${doc.id}`}
                        className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] transition-colors group/link"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href={`/book?practitionerId=${doc.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-4 py-2 text-xs font-bold uppercase tracking-wider !text-white text-white shadow-[0_4px_14px_rgba(43,87,72,0.35)] hover:shadow-[0_6px_20px_rgba(43,87,72,0.5)] transition-all duration-300 hover:scale-105"
                        style={{ color: "#ffffff" }}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Book an Appointment</span>
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
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,16,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B5C89B]" />
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
                  <span>Book an Appointment</span>
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
