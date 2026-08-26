import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Sparkles,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { listPublicServices } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Treatments & Services | Clinic Care Dental",
  description: "Explore our comprehensive dental treatments, from preventative cleanings to surgical implants and cosmetic veneers.",
};

export default async function ServicesPage() {
  const services = await listPublicServices();

  return (
    <div className="treatments-page">
      <main>
        {/* Page Hero Banner */}
        <section className="page-hero-banner py-20 text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            {/* Breadcrumb Route */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
              <ol className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
                <li>
                  <Link href="/" className="hover:text-white transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li className="text-[#9CB080]" aria-hidden="true">›</li>
                <li className="text-[#9CB080] font-bold" aria-current="page">
                  Treatments
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comprehensive Dental Portfolio</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Our Dental Treatments. <br />
              <i className="font-serif text-[#9CB080]">Tailored to Your Health.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Explore dental treatment options designed around your oral health, comfort, priorities, and individual clinical needs.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Treatment Grid Section */}
        <section className="treatments-catalogue-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="title-box text-center max-w-3xl mx-auto mb-14">
              <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Clinical Services</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
                All Treatments &amp; Procedures
              </h2>
              <p className="text-[#52605B] text-sm sm:text-base max-w-2xl mx-auto">
                Select a treatment to view an overview, typical appointment duration, and the next steps for booking.
              </p>
            </div>

            {services.length === 0 ? (
              <p className="text-center text-sm text-[#52605B]">No active services found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {services.map((service) => {
                  return (
                    <article
                      key={service.id}
                      className="treatment-card-luxury group flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#273338]/10 bg-white shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_50px_-10px_rgba(43,87,72,0.22)] hover:border-[#9CB080]/60 transition-all duration-500"
                    >
                      <div className="p-7">
                        {/* Service Category/Icon Pill */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2B5748]/08 px-3 py-1 text-[11px] font-bold text-[#2B5748] border border-[#2B5748]/12 uppercase tracking-wider">
                            <ShieldCheck className="size-3.5 text-[#2B5748]" />
                            <span>{service.category || "General Dentistry"}</span>
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-[#182320] tracking-tight group-hover:text-[#2B5748] transition-colors duration-200">
                            <Link href={`/services/${service.slug}`}>
                              {service.name}
                            </Link>
                          </h3>

                          <p className="mt-2.5 text-xs sm:text-sm text-[#52605B] leading-relaxed line-clamp-2">
                            {service.description || "Comprehensive clinical treatment tailored to your health, function, and smile aesthetics."}
                          </p>
                        </div>

                        {/* Specs & Highlight Chips */}
                        <div className="mt-6 pt-4 border-t border-[#273338]/10 flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4F6F3] px-3 py-1.5 text-xs font-semibold text-[#2B5748] border border-[#2B5748]/10">
                            <Clock className="size-3.5 text-[#2B5748]" />
                            {service.duration_minutes} mins
                          </span>

                          {service.price && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4F6F3] px-3 py-1.5 text-xs font-bold text-[#2B5748] border border-[#2B5748]/10">
                              <Tag className="size-3.5 text-[#2B5748]" />
                              From {formatCurrency(service.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-[#273338]/8 bg-[#FAFBF9]/80 px-5 py-4 flex items-center justify-between gap-2.5">
                        <Link
                          href={`/services/${service.slug}`}
                          className="group/btn inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#2B5748] hover:text-[#18362B] transition-all whitespace-nowrap shrink-0"
                        >
                          <span>Treatment Details</span>
                          <ArrowRight className="size-3 transition-transform duration-200 group-hover/btn:translate-x-1" />
                        </Link>

                        <Link
                          href={`/book?serviceId=${service.id}`}
                          className="treatment-card-book-btn inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap shrink-0 !text-white text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                          style={{ color: '#ffffff' }}
                        >
                          <span>Book an Appointment</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Services Bottom CTA Section */}
        <section className="treatments-cta relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Personalized Oral Wellness</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                Not Sure Which Treatment <br className="hidden sm:inline" />
                <i className="font-serif text-[#B5C89B]">Is Right for You?</i>
              </h2>

              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                Schedule an in-depth consultation with our clinical team to discuss your oral health goals, treatment options, and tailored care plan.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider !text-white text-white shadow-[0_8px_24px_rgba(43,87,72,0.4)] hover:shadow-[0_12px_32px_rgba(43,87,72,0.6)] transition-all duration-300 hover:scale-105 border border-[#9CB080]/30"
                  style={{ color: '#ffffff' }}
                >
                  <span>Speak with Our Team</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
