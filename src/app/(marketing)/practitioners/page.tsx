import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, UserCheck } from "lucide-react";
import { listPublicPractitioners } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Our Practitioners | Clinic Care Dental",
  description: "Meet our dedicated dental clinicians and specialists committed to comfortable, patient-first care.",
};

export default async function PractitionersPage() {
  const practitioners = await listPublicPractitioners();

  return (
    <div className="practitioners-page">
      <main>
        {/* Practitioners Hero Banner */}
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
                  Doctors
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Clinical Leadership &amp; Expertise</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Our Dental Practitioners. <br />
              <i className="font-serif text-[#9CB080]">Dedicated to Your Care.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Meet the clinicians behind your care and explore their professional focus, approach, and available appointment options.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Practitioners Grid Section */}
        <section className="practitioners-grid-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            {practitioners.length === 0 ? (
              <p className="text-center text-sm text-[#414a4c]">No active practitioners found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-8 w-full">
                {practitioners.map((doc) => {
                  const docName = (doc.profiles as { full_name?: string } | null)?.full_name || "Dental Practitioner";

                  return (
                    <div
                      key={doc.id}
                      className="practitioner-card-luxury group bg-white rounded-[32px] p-6 sm:p-7 border border-[#273338]/10 shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_50px_-10px_rgba(43,87,72,0.22)] hover:border-[#9CB080]/60 transition-all duration-500 flex flex-col justify-between"
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
                          <span>Full Profile</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                          href={`/book?practitionerId=${doc.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-4 py-2 text-xs font-bold uppercase tracking-wider !text-white text-white shadow-[0_4px_14px_rgba(43,87,72,0.35)] hover:shadow-[0_6px_20px_rgba(43,87,72,0.5)] transition-all duration-300 hover:scale-105"
                          style={{ color: "#ffffff" }}
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>Book Online</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Practitioners Bottom CTA Section */}
        <section className="practitioners-cta relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <UserCheck className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Dedicated Clinicians</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                Schedule a Consultation <br className="hidden sm:inline" />
                <i className="font-serif text-[#B5C89B]">With Our Specialists.</i>
              </h2>

              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                Choose your preferred practitioner and book your appointment online to begin your personalized oral wellness journey.
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
