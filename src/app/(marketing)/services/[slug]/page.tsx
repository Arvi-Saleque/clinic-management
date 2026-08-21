import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Sparkles, Tag } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { getPublicServiceBySlug } from "@/lib/server/marketing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  return {
    title: `${service?.name || "Treatment"} | Clinic Care Dental`,
    description: service?.description || "Comprehensive dental care tailored to your comfort and health.",
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  if (!service) notFound();

  const steps = [
    {
      step: "01",
      name: "Clinical Examination & Assessment",
      desc: "A detailed clinical assessment to understand your oral health, priorities, and the information needed for treatment planning.",
    },
    {
      step: "02",
      name: "Treatment Planning & Consultation",
      desc: "Our clinicians walk you through every stage, expected timeline, and transparent pricing breakdown.",
    },
    {
      step: "03",
      name: "Clinical Procedure",
      desc: "Comfort-focused clinical care delivered according to the treatment plan discussed with you.",
    },
    {
      step: "04",
      name: "Review & Aftercare Support",
      desc: "Post-treatment review, maintenance guidance, and follow-up planning based on your clinical needs.",
    },
  ];

  return (
    <div className="treatment-detail-page">
      <main>
        {/* Detail Hero Section */}
        <section className="treatment-hero py-20 text-white">
          <div className="container max-w-6xl mx-auto px-4">
            {/* Breadcrumb Route (Dhaka Heights style) */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
                <li>
                  <Link href="/" className="hover:text-white transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li className="text-[#9CB080]" aria-hidden="true">›</li>
                <li>
                  <Link href="/services" className="hover:text-white transition-colors duration-200">
                    Treatments
                  </Link>
                </li>
                <li className="text-[#9CB080]" aria-hidden="true">›</li>
                <li className="text-[#9CB080] font-bold" aria-current="page">
                  {service.name}
                </li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="hero-text-col">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-xs text-[#9CB080] font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{service.category || "Clinical Procedure"}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight mb-6">
                  {service.name}
                </h1>

                <p className="text-base text-white/80 leading-relaxed mb-6">
                  {service.description ||
                    "A dental treatment planned around your oral health, comfort, functional needs, and individual clinical assessment."}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-[#9CB080] mb-8 pb-6 border-b border-white/15">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} Minutes
                  </span>
                  {service.price && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      From €{Number(service.price).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href={`/book?serviceId=${service.id}`} className="btn-blue">
                    <CalendarDays className="w-4 h-4 mr-2 inline" />
                    Book This Service
                  </Link>
                  <Link href="/contact" className="btn-stroke border-white/20 hover:border-white text-white">
                    Ask the Clinic
                  </Link>
                </div>
              </div>

              <div className="hero-media-col">
                <Card3D>
                  <img
                    src="/marketing/ceramist_artistry.jpg"
                    alt={service.name}
                    className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                  />
                </Card3D>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Treatment Journey Section */}
        <section className="treatment-steps-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="title-box text-center max-w-2xl mx-auto mb-12">
              <span className="subtitle-italic text-[#2B5748] font-semibold">Step-by-Step</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-[#273338] mt-2 mb-4">
                What to Expect During Your Treatment
              </h2>
              <p className="text-[#414a4c] text-sm sm:text-base">
                A clear treatment journey from initial assessment and planning through clinical care and follow-up.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {steps.map((s, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-white border border-[#273338]/10 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#273338] mb-1">{s.name}</h3>
                    <p className="text-xs sm:text-sm text-[#414a4c] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href={`/book?serviceId=${service.id}`} className="btn">
                <CalendarDays className="w-4 h-4 mr-2 inline" />
                Schedule Your Appointment
              </Link>
            </div>
          </div>
        </section>

        {/* Return to Catalogue */}
        <div className="py-8 bg-[#FBFBF9] border-t border-[#273338]/10 text-center">
          <Link href="/services" className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080]">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Return to All Treatments &amp; Services</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
