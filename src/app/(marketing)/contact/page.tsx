import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { getClinicInfo } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Contact Us | Clinic Care Dental",
  description: "Contact Clinic Care Dental for appointment, treatment, and practice enquiries.",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${period}`;
}

export default async function ContactPage() {
  const { branch, hours } = await getClinicInfo();

  const clinicName = branch?.name || "Clinic Care Dental Practice";
  const address = branch?.address || "74 Harley Street, Marylebone, London W1G 7HQ";
  const phone = branch?.phone || "+44 (020) 7946 0000";
  const phoneClean = phone.replace(/\s+/g, "");
  const email = branch?.email || "concierge@cliniccare.test";

  return (
    <div className="contact-page">
      <main>
        {/* Contact Hero Banner */}
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinic Contact &amp; Patient Support</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              Get in Touch with <br />
              <i className="font-serif text-[#9CB080]">Our Clinic Team.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Have questions regarding appointments, treatments, or travel directions? Our clinic team can help with appointment, treatment, and practice enquiries.
            </p>
          </div>
        </section>

        {/* Contact Grid Section */}
        <section className="contact-details-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Direct Contact & Hours */}
              <div className="lg:col-span-6 space-y-8">
                <div className="bg-white rounded-3xl p-8 border border-[#273338]/10 shadow-sm space-y-6">
                  <h2 className="text-2xl font-medium text-[#273338]">{clinicName}</h2>

                  <div className="space-y-4 text-sm text-[#414a4c]">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#2B5748] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Practice Location:</span>
                        <span>{address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[#2B5748] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Direct Telephone:</span>
                        <a href={`tel:${phoneClean}`} className="hover:text-[#2B5748] transition-colors font-medium">
                          {phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#2B5748] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#273338] block">Email Inquiries:</span>
                        <a href={`mailto:${email}`} className="hover:text-[#2B5748] transition-colors font-medium">
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#9CB080]/15 border border-[#9CB080]/30 text-xs text-[#273338] flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#2B5748] shrink-0" />
                    <span>If you need urgent dental support, contact the clinic directly so the team can advise on available care options.</span>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="bg-white rounded-3xl p-8 border border-[#273338]/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#2B5748]" />
                    <h3 className="text-xl font-medium text-[#273338]">Opening Hours</h3>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm text-[#414a4c]">
                    {hours && hours.length > 0 ? (
                      hours.map((h) => (
                        <div key={h.day_of_week} className="flex justify-between py-1.5 border-b border-[#273338]/5">
                          <span className="font-medium text-[#273338]">{DAY_NAMES[h.day_of_week]}</span>
                          <span>
                            {h.is_closed ? (
                              <span className="text-red-500 font-semibold">Closed</span>
                            ) : (
                              `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#414a4c]/70">Standard hours: Monday – Friday 9:00 AM – 6:00 PM</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Booking & Fast Track Consultation Card */}
              <div className="lg:col-span-6">
                <Card3D className="bg-white rounded-3xl p-8 sm:p-10 border border-[#273338]/10 shadow-xl flex flex-col justify-between h-full">
                  <div>
                    <span className="subtitle-italic text-[#2B5748] font-semibold">Online Booking</span>
                    <h3 className="text-2xl sm:text-3xl font-light text-[#273338] mt-2 mb-4">
                      Continue to Online Booking
                    </h3>
                    <p className="text-sm text-[#414a4c] leading-relaxed mb-6">
                      Start the online booking journey, then sign in or create a patient account to view the appointment options available to you.
                    </p>

                    <div className="space-y-3 mb-8 text-xs sm:text-sm text-[#273338]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9CB080] font-bold">✓</span>
                        <span>Connected patient appointment management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9CB080] font-bold">✓</span>
                        <span>Treatment and practitioner selection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9CB080] font-bold">✓</span>
                        <span>Appointment details linked to your account</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9CB080] font-bold">✓</span>
                        <span>Patient portal access after sign-in</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-[#273338]/10">
                    <Link href="/book" className="btn-blue w-full text-center block">
                      <CalendarDays className="w-4 h-4 mr-2 inline" />
                      Continue to Online Booking
                    </Link>
                    <a
                      href={`tel:${phoneClean}`}
                      className="btn-stroke text-[#273338] border-[#273338]/30 w-full text-center block"
                    >
                      Call Clinic: {phone}
                    </a>
                  </div>
                </Card3D>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
