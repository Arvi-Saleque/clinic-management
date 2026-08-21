import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Sparkles, Tag } from "lucide-react";
import { listPublicServices } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Treatments & Services | Clinic Care Dental",
  description: "Explore our comprehensive cosmetic, restorative, orthodontic, and general dental treatments.",
};

const defaultImages: Record<string, string> = {
  veneers: "/marketing/ceramist_artistry.jpg",
  implants: "/marketing/hero_implant.png",
  invisalign: "/marketing/hero_aligners.png",
  whitening: "/marketing/hero_smile.png",
  general: "/marketing/hero_dentist.png",
  checkup: "/marketing/hero_clinic.png",
};

export default async function ServicesPage() {
  const services = await listPublicServices();

  return (
    <div className="treatments-page">
      <main>
        {/* Treatments Hero Banner */}
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
                  Treatments
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dental Treatments &amp; Care Options</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Thoughtful Treatment Planning. <br />
              <i className="font-serif text-[#9CB080]">Care Built Around You.</i>
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

        {/* Treatments Grid Section */}
        <section className="treatments-catalogue-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container px-4">
            <div className="title-box text-center max-w-2xl mx-auto mb-12">
              <span className="subtitle-italic text-[#2B5748] font-semibold">Our Services</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-[#273338] mt-2 mb-4">
                Explore Our Treatment Options
              </h2>
              <p className="text-[#414a4c] text-sm sm:text-base">
                Select a treatment to view an overview, typical appointment duration, and the next steps for booking.
              </p>
            </div>

            {services.length === 0 ? (
              <p className="text-center text-sm text-[#414a4c]">No active services found in database.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {services.map((service, idx) => {
                  const key = Object.keys(defaultImages)[idx % Object.keys(defaultImages).length];
                  const imgSrc = defaultImages[key];

                  return (
                    <article
                      key={service.id}
                      className="treatment-card-luxury group relative flex flex-col justify-between rounded-[28px] bg-white border border-[#273338]/10 shadow-[0_10px_30px_-5px_rgba(27,38,33,0.06),0_20px_40px_-10px_rgba(27,38,33,0.08)] hover:shadow-[0_24px_50px_-10px_rgba(43,87,72,0.18)] hover:border-[#9CB080]/50 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                    >
                      {/* Top Media & Floating Category Badge */}
                      <div className="relative">
                        <div className="aspect-[16/10] w-full overflow-hidden bg-[#1D2B26]">
                          <img
                            src={imgSrc}
                            alt={service.name}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2421]/60 via-transparent to-black/20 pointer-events-none" />
                        </div>

                        {service.category && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14201C]/85 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#B5C89B] shadow-md backdrop-blur-md border border-white/20">
                              <span className="size-1.5 rounded-full bg-[#B5C89B] animate-pulse" />
                              {service.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                        <div>
                          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#1F2421] group-hover:text-[#2B5748] transition-colors duration-200">
                            {service.name}
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
                              From £{Number(service.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-[#273338]/8 bg-[#FAFBF9]/80 px-6 py-4.5 flex items-center justify-between gap-3">
                        <Link
                          href={`/services/${service.slug}`}
                          className="group/btn inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2B5748] hover:text-[#18362B] transition-all"
                        >
                          <span>Treatment Details</span>
                          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                        </Link>

                        <Link
                          href={`/book?serviceId=${service.id}`}
                          className="treatment-card-book-btn inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-5 py-2.5 text-xs font-bold uppercase tracking-wider !text-white text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                          style={{ color: '#ffffff' }}
                        >
                          <span>Book Now</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Treatments Bottom CTA */}
        <section className="treatments-cta relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 px-4 text-center max-w-4xl mx-auto">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Personalized Guidance</span>
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
