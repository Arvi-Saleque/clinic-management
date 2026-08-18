import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles, UserCheck } from "lucide-react";
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
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinical Leadership &amp; Expertise</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              Our Dental Practitioners. <br />
              <i className="font-serif text-[#9CB080]">Dedicated to Your Care.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Meet the clinicians behind your care and explore their professional focus, approach, and available appointment options.
            </p>
          </div>
        </section>

        {/* Practitioners Grid Section */}
        <section className="practitioners-grid-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-6xl mx-auto px-4">
            {practitioners.length === 0 ? (
              <p className="text-center text-sm text-[#414a4c]">No active practitioners found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {practitioners.map((doc) => {
                  const docName = (doc.profiles as { full_name?: string } | null)?.full_name || "Dental Practitioner";

                  return (
                    <div
                      key={doc.id}
                      className="practitioner-card-luxury bg-white rounded-3xl p-6 border border-[#273338]/10 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-muted/40 relative flex items-center justify-center">
                          {doc.photo_url ? (
                            <img src={doc.photo_url} alt={docName} className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-14 h-14 text-[#2B5748]/40" />
                          )}
                        </div>

                        <h3 className="text-xl font-medium text-[#273338]">{docName}</h3>
                        <p className="text-sm font-semibold text-[#2B5748] mt-1">{doc.title || "General & Cosmetic Dentist"}</p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(doc.specialties || []).map((spec, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] bg-[#2B5748]/10 text-[#2B5748] font-medium px-2.5 py-0.5 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs sm:text-sm text-[#414a4c] mt-4 line-clamp-3 leading-relaxed">
                          {doc.bio || "Dedicated clinician providing individualized, gentle dental care and restorative treatments."}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-[#273338]/10 flex items-center justify-between gap-2">
                        <Link
                          href={`/practitioners/${doc.id}`}
                          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] transition-colors"
                        >
                          <span>Full Profile</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                        <Link
                          href={`/book?practitionerId=${doc.id}`}
                          className="btn-blue text-[11px] py-2 px-3.5 uppercase tracking-wider"
                        >
                          Book Online
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Practitioners CTA */}
        <section className="practitioners-cta py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center max-w-3xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                Schedule a Consultation with Our Clinicians
              </h3>
              <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
                Choose your preferred practitioner and continue to online booking to view the appointment options available to you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/book" className="btn-blue">
                  <CalendarDays className="w-4 h-4 mr-2 inline" />
                  Book with a Practitioner
                </Link>
                <Link href="/contact" className="btn-stroke border-white/20 hover:border-white text-white">
                  Contact Clinic
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
