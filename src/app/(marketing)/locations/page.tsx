import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { getClinicInfo } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Our Locations | Clinic Care Dental",
  description: "Find Clinic Care Dental, opening hours, contact details, and appointment access.",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function LocationsPage() {
  const { branch, hours } = await getClinicInfo();

  const clinicName = branch?.name || "Clinic Care Dental Practice";
  const address = branch?.address || "74 Harley Street, Marylebone, London W1G 7HQ";
  const phone = branch?.phone || "+44 (020) 7946 0000";
  const email = branch?.email || "concierge@cliniccare.test";

  return (
    <div className="locations-page">
      <main>
        {/* Locations Hero Banner */}
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
                  Locations
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>Visit Clinic Care Dental</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Our Practice Location. <br />
              <i className="font-serif text-[#9CB080]">Comfortable, Calm &amp; Connected.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Find our clinic details, opening hours, contact information, and the easiest way to start your appointment journey.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Location Card & Details Section */}
        <section className="locations-content-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: 3D Imagery Card */}
              <div className="lg:col-span-6">
                <Card3D className="bg-white rounded-3xl overflow-hidden border border-[#273338]/10 shadow-xl">
                  <div className="aspect-[4/3] relative">
                    <img
                      src="/marketing/hero_clinic.png"
                      alt={clinicName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 left-4 bg-[#273338]/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                      Primary Clinic
                    </span>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-medium text-[#273338] mb-2">{clinicName}</h3>
                    <p className="text-sm text-[#414a4c] leading-relaxed mb-6">
                      A patient-focused clinic environment designed for clear consultations, comfortable visits, and coordinated dental care.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-[#2B5748] font-semibold">
                      <span className="bg-[#2B5748]/10 px-3 py-1.5 rounded-xl">✓ Digital Treatment Planning</span>
                      <span className="bg-[#2B5748]/10 px-3 py-1.5 rounded-xl">✓ Modern Clinical Workflows</span>
                      <span className="bg-[#2B5748]/10 px-3 py-1.5 rounded-xl">✓ Patient Consultation Support</span>
                      <span className="bg-[#2B5748]/10 px-3 py-1.5 rounded-xl">✓ Appointment & Visit Support</span>
                    </div>
                  </div>
                </Card3D>
              </div>

              {/* Right Column: Factual Contact & Opening Hours */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-[#273338]/10 shadow-sm space-y-6">
                  <h3 className="text-xl font-medium text-[#273338]">Contact Coordinates</h3>

                  <div className="space-y-4 text-sm text-[#414a4c]">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#2B5748] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Address:</span>
                        <span>{address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[#2B5748] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Phone:</span>
                        <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-[#2B5748] transition-colors">
                          {phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#2B5748] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Email:</span>
                        <a href={`mailto:${email}`} className="hover:text-[#2B5748] transition-colors">
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#273338]/10">
                    <Link href="/book" className="btn-blue w-full text-center block">
                      <CalendarDays className="w-4 h-4 mr-2 inline" />
                      Book Appointment Online
                    </Link>
                  </div>
                </div>

                {/* Opening Hours Card */}
                <div className="bg-white rounded-3xl p-8 border border-[#273338]/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#2B5748]" />
                    <h3 className="text-xl font-medium text-[#273338]">Opening Hours</h3>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm text-[#414a4c]">
                    {hours && hours.length > 0 ? (
                      hours.map((h) => (
                        <div key={h.day_of_week} className="flex justify-between py-1 border-b border-[#273338]/5">
                          <span className="font-medium text-[#273338]">{DAY_NAMES[h.day_of_week]}:</span>
                          <span>
                            {h.is_closed ? (
                              <span className="text-red-500 font-semibold">Closed</span>
                            ) : (
                              `${(h.open_time || "09:00:00").slice(0, 5)} – ${(h.close_time || "18:00:00").slice(0, 5)}`
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#273338]/5">
                          <span className="font-medium text-[#273338]">Monday – Friday:</span>
                          <span>9:00 AM – 6:00 PM</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#273338]/5">
                          <span className="font-medium text-[#273338]">Saturday:</span>
                          <span>10:00 AM – 4:00 PM</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-[#273338]">Sunday:</span>
                          <span className="text-red-500 font-semibold">Closed</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
