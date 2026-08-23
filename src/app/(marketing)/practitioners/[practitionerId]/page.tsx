import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, UserCheck } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { getPublicPractitionerById } from "@/lib/server/marketing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}): Promise<Metadata> {
  const { practitionerId } = await params;
  const practitioner = await getPublicPractitionerById(practitionerId);
  const name = (practitioner?.profiles as { full_name?: string } | null)?.full_name || "Practitioner";
  return {
    title: `${name} | Clinic Care Dental`,
    description: practitioner?.bio || "Experienced dental practitioner at Clinic Care Dental.",
  };
}

export default async function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = await params;
  const practitioner = await getPublicPractitionerById(practitionerId);
  if (!practitioner) notFound();

  const name = (practitioner.profiles as { full_name?: string } | null)?.full_name || "Dental Practitioner";

  return (
    <div className="practitioner-detail-page">
      <main>
        {/* Detail Hero Section */}
        <section className="practitioner-hero py-20 bg-[#273338] text-white">
          <div className="container max-w-6xl mx-auto px-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/60 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/practitioners" className="hover:text-white transition-colors">Doctors</Link>
              <span>/</span>
              <span className="text-[#9CB080]">{name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <Card3D>
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center relative">
                    {practitioner.photo_url ? (
                      <img src={practitioner.photo_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-24 h-24 text-white/30" />
                    )}
                  </div>
                </Card3D>
              </div>

              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-xs text-[#9CB080] font-semibold mb-4">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{practitioner.title || "Dental Clinician"}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight mb-4">
                  {name}
                </h1>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(practitioner.specialties || []).map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-xs bg-white/10 text-white/90 border border-white/15 px-3 py-1 rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="prose prose-invert text-sm sm:text-base text-white/80 leading-relaxed mb-8 space-y-4">
                  <p>
                    {practitioner.bio ||
                      "A committed dental practitioner providing high standards of care, restorative treatments, and patient-first clinical guidance."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href={`/book?practitionerId=${practitioner.id}`} className="btn-blue">
                    <CalendarDays className="w-4 h-4 mr-2 inline" />
                    Book an Appointment
                  </Link>
                  <Link href="/contact" className="btn-stroke border-white/20 hover:border-white text-white">
                    Contact Clinic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back Link Bar */}
        <div className="py-8 bg-[#FBFBF9] border-t border-[#273338]/10 text-center">
          <Link
            href="/practitioners"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Return to All Dental Practitioners</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
