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
                    <div
                      key={service.id}
                      className="treatment-card-luxury bg-white rounded-3xl overflow-hidden border border-[#273338]/10 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/10] overflow-hidden relative group">
                          <img
                            src={imgSrc}
                            alt={service.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {service.category && (
                            <span className="absolute top-4 left-4 bg-[#273338]/85 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                              {service.category}
                            </span>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-medium text-[#273338] mb-2">{service.name}</h3>
                          <p className="text-xs sm:text-sm text-[#414a4c] leading-relaxed line-clamp-3 mb-4">
                            {service.description || "Comprehensive clinical treatment tailored to your health and smile aesthetics."}
                          </p>

                          <div className="flex items-center gap-4 text-xs font-semibold text-[#2B5748] pt-2 border-t border-[#273338]/10">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {service.duration_minutes} mins
                            </span>
                            {service.price && (
                              <span className="flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                From £{Number(service.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between gap-3">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] inline-flex items-center transition-colors"
                        >
                          <span>Treatment Details</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                        <Link
                          href={`/book?serviceId=${service.id}`}
                          className="btn-blue text-[11px] py-2 px-4 uppercase tracking-wider"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Treatments Bottom CTA */}
        <section className="treatments-cta py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center max-w-3xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                Not Sure Which Treatment Is Right for You?
              </h3>
              <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
                Schedule a consultation with our clinical team to discuss your needs and the options that may be suitable for you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/book" className="btn-blue">
                  <CalendarDays className="w-4 h-4 mr-2 inline" />
                  Book Consultation Online
                </Link>
                <Link href="/contact" className="btn-stroke border-white/20 hover:border-white text-white">
                  Speak with Our Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
