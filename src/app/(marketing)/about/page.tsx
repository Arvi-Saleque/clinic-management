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
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modern Clinical &amp; Aesthetic Dentistry</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              Crafting Smiles with <br />
              <i className="font-serif text-[#9CB080]">Precision, Comfort &amp; Artistry.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Founded on the belief that a visit to the dentist should feel calming, transparent, and tailored to your individual wellness and aesthetic goals.
            </p>
          </div>
        </section>

        {/* Philosophy & Origin Story */}
        <section className="story-split-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="story-content-col">
                <span className="subtitle-italic text-[#2B5748] font-semibold">Our Philosophy</span>
                <h2 className="h3 text-3xl sm:text-4xl font-light text-[#273338] mt-2 mb-6">
                  Personalized Care Built Around You
                </h2>
                <p className="text-base text-[#414a4c] leading-relaxed mb-4">
                  At Clinic Care Dental, we combine advanced digital workflows with genuine clinician attentiveness. We take time to listen, explain every option clearly, and treat each patient with gentle precision.
                </p>
                <p className="text-base text-[#414a4c] leading-relaxed mb-8">
                  From single-tooth restorations to complete smile transformations, each treatment plan is carefully engineered for long-term health and natural aesthetics.
                </p>

                <div className="values-list space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm shrink-0">
                      01
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Comfort-Focused Care</h4>
                      <p className="text-sm text-[#414a4c] mt-1">
                        A serene and reassuring clinic environment with gentle local anaesthesia tailored for relaxed visits.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm shrink-0">
                      02
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Custom Porcelain Restorations</h4>
                      <p className="text-sm text-[#414a4c] mt-1">
                        High-grade medical ceramics shade-matched to your unique natural tooth colour and smile line.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-sm shrink-0">
                      03
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#273338]">Transparent Treatment Guidance</h4>
                      <p className="text-sm text-[#414a4c] mt-1">
                        Clear treatment discussions and itemised information so you understand the proposed care before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="story-media-col">
                <Card3D className="story-image-card">
                  <img
                    src="/marketing/demo_dental_team.png"
                    alt="Clinic Care Clinical Team"
                    className="rounded-3xl shadow-xl w-full object-cover"
                  />
                </Card3D>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Digital Dental Technology Showcase */}
        <section className="tech-showcase-section py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center">
            <div className="title-box max-w-2xl mx-auto mb-12">
              <span className="subtitle-italic text-[#9CB080]">Next-Generation Technology</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-white mt-2 mb-4">
                Our Digital Dentistry Suite
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                Modern digital diagnostic equipment for precise planning, patient comfort, and reliable clinical outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {techStack.map((tech, idx) => (
                <Card3D key={idx} className="tech-card-item p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                  <div className="text-xs font-bold text-[#9CB080] uppercase tracking-wider mb-2">0{idx + 1}</div>
                  <h4 className="text-lg font-medium text-white mb-2">{tech.title}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{tech.desc}</p>
                </Card3D>
              ))}
            </div>
          </div>
        </section>

        {/* Real Production Team Showcase */}
        <section className="team-section-wrapper py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container px-4">
            <div className="title-box text-center max-w-2xl mx-auto mb-12">
              <span className="subtitle-italic text-[#2B5748] font-semibold">Clinical Team</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-[#273338] mt-2 mb-4">
                Meet Our Dental Practitioners
              </h2>
              <p className="text-[#414a4c] text-sm sm:text-base">
                Experienced clinicians committed to patient-first care, aesthetic precision, and comprehensive dental health.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {practitioners.map((doc) => {
                const docName = (doc.profiles as { full_name?: string } | null)?.full_name || "Dental Practitioner";
                return (
                  <div key={doc.id} className="team-card bg-white rounded-3xl p-6 border border-[#273338]/10 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-muted/40 relative flex items-center justify-center">
                        {doc.photo_url ? (
                          <img src={doc.photo_url} alt={docName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-12 h-12 text-[#2B5748]/40" />
                        )}
                      </div>
                      <h3 className="text-xl font-medium text-[#273338]">{docName}</h3>
                      <p className="text-sm font-semibold text-[#2B5748] mt-1">{doc.title || "General & Cosmetic Dentist"}</p>
                      <p className="text-xs text-[#414a4c] mt-3 line-clamp-3 leading-relaxed">
                        {doc.bio || "Dedicated clinician providing individualized, gentle dental care and restorative treatments."}
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-[#273338]/10">
                      <Link
                        href={`/practitioners/${doc.id}`}
                        className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] transition-colors"
                      >
                        <span>View Profile &amp; Availability</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link href="/practitioners" className="btn-stroke text-[#273338] border-[#273338]/30 hover:border-[#273338]">
                View All Practitioners &amp; Schedules
              </Link>
            </div>
          </div>
        </section>

        {/* About CTA */}
        <section className="about-cta-section py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center max-w-3xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                Experience Personalized Dental Care
              </h3>
              <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
                Schedule your appointment online or explore our modern clinic facilities and treatment options.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/book" className="btn-blue">
                  <CalendarDays className="w-4 h-4 mr-2 inline" />
                  Book Appointment Online
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
