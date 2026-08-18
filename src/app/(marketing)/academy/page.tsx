import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Clinical Education (Academy) | Clinic Care Dental",
  description: "Continuing dental education, clinical peer workshops, and digital dentistry training.",
};

const workshops = [
  {
    id: "digital-dentistry-mastery",
    title: "Digital Smile Planning & 3D Optical Scanning",
    type: "Clinical Workshop",
    desc: "A peer-to-peer session exploring 3D intraoral mapping, digital diagnostic mockups, and modern adhesive restoration protocols.",
    topics: ["3D Optical Impression Techniques", "Occlusion Dynamics & Enamel Preservation", "Digital Case Planning"],
  },
  {
    id: "guided-implantology",
    title: "Guided Implantology & 3D CBCT Diagnostics",
    type: "Advanced Clinical Study",
    desc: "Study sessions covering low-dose 3D cone-beam tomography, virtual implant planning, and surgical guide design.",
    topics: ["Computer-Guided Diagnostics", "Bone Density Assessment", "Restorative Coordination"],
  },
  {
    id: "patient-comfort-systems",
    title: "Comfort-Focused Care & Patient Pacing in Private Practice",
    type: "Practice Seminar",
    desc: "A clinical seminar on patient communication, anxiety alleviation techniques, and workflow efficiency.",
    topics: ["Patient Communication Protocols", "Local Anaesthetic Delivery", "Clinical Workflow Optimization"],
  },
];

export default function AcademyPage() {
  return (
    <div className="academy-page">
      <main>
        {/* Academy Hero */}
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Continuing Professional Development</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              Clinical Education &amp; Workshops. <br />
              <i className="font-serif text-[#9CB080]">Advancing Digital Dentistry.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Peer-led clinical study sessions, digital workflow seminars, and continuing dental education programs for healthcare professionals.
            </p>
          </div>
        </section>

        {/* Curriculum Section */}
        <section className="academy-curriculum-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="title-box text-center max-w-2xl mx-auto mb-12">
              <span className="subtitle-italic text-[#2B5748] font-semibold">Educational Modules</span>
              <h2 className="h3 text-3xl sm:text-4xl font-light text-[#273338] mt-2 mb-4">
                Clinical Study &amp; Workshop Topics
              </h2>
              <p className="text-[#414a4c] text-sm sm:text-base">
                Discover our practice-led seminars focused on modern digital workflows and patient-first dentistry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {workshops.map((w) => (
                <div key={w.id} className="bg-white rounded-3xl p-6 border border-[#273338]/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="inline-block bg-[#2B5748]/10 text-[#2B5748] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                      {w.type}
                    </span>
                    <h3 className="text-xl font-medium text-[#273338] mb-3 leading-snug">{w.title}</h3>
                    <p className="text-xs sm:text-sm text-[#414a4c] leading-relaxed mb-6">{w.desc}</p>
                    <ul className="space-y-2 text-xs text-[#273338] mb-6">
                      {w.topics.map((t, tIdx) => (
                        <li key={tIdx} className="flex items-center gap-2">
                          <span className="text-[#9CB080] font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#273338]/10">
                    <Link
                      href="/contact"
                      className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      <span>Inquire for Upcoming Schedules</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Academy CTA */}
        <section className="academy-cta py-20 bg-[#273338] text-white">
          <div className="container px-4 text-center max-w-3xl mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                Interested in Clinical Peer Study?
              </h3>
              <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
                Get in touch with our clinical practice coordinators for details regarding workshop schedules and topics.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact" className="btn-blue">
                  <Mail className="w-4 h-4 mr-2 inline" />
                  Contact Clinic Concierge
                </Link>
                <Link href="/services" className="btn-stroke border-white/20 hover:border-white text-white">
                  Explore Treatments
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
