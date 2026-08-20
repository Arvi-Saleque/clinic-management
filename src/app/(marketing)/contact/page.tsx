import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Car,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Train,
} from "lucide-react";
import { Card3D } from "@/components/marketing/luxury-card3d";
import { ContactFaqAccordion } from "@/components/marketing/contact-faq-accordion";
import { getClinicInfo } from "@/lib/server/marketing";

export const metadata: Metadata = {
  title: "Contact Us & Location | Clinic Care Dental",
  description: "Contact Clinic Care Dental for appointment, treatment, and practice enquiries. Find our clinic location, opening hours, transit guide, and FAQs.",
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

  // Google Maps embed URL for the clinic address
  const encodedAddress = encodeURIComponent(address);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="contact-page">
      <main>
        {/* Contact Hero Banner */}
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
                  Contact
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinic Contact &amp; Patient Concierge</span>
            </div>

            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Get in Touch with <br />
              <i className="font-serif text-[#9CB080]">Our Clinical Team.</i>
            </h1>

            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Have questions regarding appointments, treatments, or travel directions? Our dedicated team is here to assist with personalized care and practice guidance.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        {/* Contact Details & Fast-Track Booking Section */}
        <section className="contact-details-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Left Column: Direct Contact & Opening Hours */}
              <div className="lg:col-span-6 space-y-8 flex flex-col justify-between">
                {/* Practice Contact Card */}
                <div className="bg-white rounded-[32px] p-7 sm:p-9 border border-[#273338]/10 shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07)] space-y-6 hover:shadow-[0_20px_40px_-10px_rgba(43,87,72,0.15)] transition-all duration-300">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2B5748] bg-[#2B5748]/08 px-3 py-1 rounded-full border border-[#2B5748]/12">
                      Direct Concierge
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#182320] mt-3">{clinicName}</h2>
                  </div>

                  <div className="space-y-3.5 text-sm text-[#4E5B55]">
                    {/* Address Row */}
                    <div className="flex items-start gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-[#2B5748]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[#182320] block text-xs uppercase tracking-wider mb-0.5">Practice Address</span>
                        <span className="text-sm sm:text-base leading-relaxed text-[#273338] break-words">{address}</span>
                      </div>
                    </div>

                    {/* Phone Row */}
                    <div className="flex items-center gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-[#2B5748]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[#182320] block text-xs uppercase tracking-wider mb-0.5">Direct Telephone</span>
                        <a href={`tel:${phoneClean}`} className="text-sm sm:text-base font-semibold text-[#2B5748] hover:underline break-words block">
                          {phone}
                        </a>
                      </div>
                    </div>

                    {/* Email Row */}
                    <div className="flex items-center gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-[#2B5748]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[#182320] block text-xs uppercase tracking-wider mb-0.5">Email Inquiry</span>
                        <a href={`mailto:${email}`} className="text-sm sm:text-base font-semibold text-[#2B5748] hover:underline break-all block">
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-[#9CB080]/15 border border-[#9CB080]/35 text-xs sm:text-sm text-[#1F2E28] flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#2B5748] shrink-0" />
                    <span><strong>Urgent Support:</strong> If you are experiencing acute tooth discomfort, contact our reception immediately for priority emergency care.</span>
                  </div>
                </div>

                {/* Opening Hours Card */}
                <div className="bg-white rounded-[32px] p-7 sm:p-9 border border-[#273338]/10 shadow-[0_12px_36px_-6px_rgba(27,38,33,0.07)] hover:shadow-[0_20px_40px_-10px_rgba(43,87,72,0.15)] transition-all duration-300">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-full bg-[#2B5748]/10 flex items-center justify-center text-[#2B5748]">
                      <Clock className="w-5 h-5 text-[#2B5748]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#182320]">Practice Operating Hours</h3>
                      <p className="text-xs text-[#7A8681]">Consultations &amp; Clinical Appointments</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-[#4E5B55]">
                    {hours && hours.length > 0 ? (
                      hours.map((h) => (
                        <div key={h.day_of_week} className="flex justify-between py-2 border-b border-[#273338]/06 last:border-0">
                          <span className="font-semibold text-[#182320]">{DAY_NAMES[h.day_of_week]}</span>
                          <span>
                            {h.is_closed ? (
                              <span className="text-red-500 font-semibold bg-red-50 px-2.5 py-0.5 rounded-full text-xs">Closed</span>
                            ) : (
                              <span className="font-mono text-[#2B5748] font-semibold">{formatTime(h.open_time)} – {formatTime(h.close_time)}</span>
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

              {/* Right Column: Direct Online Booking Card */}
              <div className="lg:col-span-6 flex">
                <Card3D className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#273338]/10 shadow-[0_16px_44px_-8px_rgba(27,38,33,0.1)] flex flex-col justify-between w-full">
                  <div>
                    <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Instant Online Booking</span>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
                      Reserve Your Visit <i className="font-serif text-[#2B5748]">Directly Online</i>
                    </h3>
                    <p className="text-sm sm:text-base text-[#4E5B55] leading-relaxed mb-8 font-normal">
                      Experience seamless appointment booking. Choose your treatment, select your preferred practitioner, and choose a time that fits your lifestyle.
                    </p>

                    <div className="space-y-4 mb-10 text-sm text-[#182320]">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06">
                        <span className="w-7 h-7 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                        <span className="font-medium">Real-time practitioner availability &amp; slot selection</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06">
                        <span className="w-7 h-7 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                        <span className="font-medium">Transparent itemized treatment options &amp; consultation info</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06">
                        <span className="w-7 h-7 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                        <span className="font-medium">Instant confirmation &amp; digital calendar sync</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9F8] border border-[#273338]/06">
                        <span className="w-7 h-7 rounded-full bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                        <span className="font-medium">Direct access to patient medical forms and records portal</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-[#273338]/08">
                    <Link
                      href="/book"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider !text-white text-white shadow-[0_8px_24px_rgba(43,87,72,0.4)] hover:shadow-[0_12px_32px_rgba(43,87,72,0.6)] transition-all duration-300 hover:scale-[1.02] w-full text-center"
                      style={{ color: "#ffffff" }}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Continue to Online Booking</span>
                    </Link>

                    <a
                      href={`tel:${phoneClean}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-[#F8F9F8] text-[#182320] border border-[#273338]/20 hover:border-[#273338]/40 px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 w-full text-center"
                    >
                      <Phone className="w-4 h-4 text-[#2B5748]" />
                      <span>Speak with Our Team: {phone}</span>
                    </a>
                  </div>
                </Card3D>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Location Map & Transit Guide Section */}
        <section className="contact-map-section py-24 bg-[#F2F4F2] text-[#273338]">
          <div className="container">
            <div className="title-box text-center max-w-3xl mx-auto mb-14">
              <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Location &amp; Directions</span>
              <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
                Find Our Clinic in Marylebone, London
              </h2>
              <p className="text-[#4E5B55] text-sm sm:text-base max-w-2xl mx-auto">
                Centrally located on historic Harley Street with convenient underground links, public transit, and underground parking.
              </p>
            </div>

            {/* Map Frame Container */}
            <div className="rounded-[32px] overflow-hidden border border-[#273338]/10 shadow-[0_20px_50px_-10px_rgba(27,38,33,0.12)] bg-white p-3 sm:p-4 mb-12">
              <div className="aspect-[16/9] md:aspect-[21/9] w-full rounded-[24px] overflow-hidden relative">
                <iframe
                  title="Clinic Care Dental Location Map"
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Transit & Accessibility Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="p-7 rounded-[28px] bg-white border border-[#273338]/08 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center mb-4">
                    <Train className="w-6 h-6 text-[#2B5748]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#182320] mb-2">By Underground / Train</h4>
                  <p className="text-xs sm:text-sm text-[#52605B] leading-relaxed">
                    Within a 5 to 8-minute stroll from <strong>Regent&apos;s Park</strong> (Bakerloo), <strong>Oxford Circus</strong> (Central, Victoria, Bakerloo), and <strong>Bond Street</strong> (Elizabeth &amp; Jubilee lines).
                  </p>
                </div>
              </div>

              <div className="p-7 rounded-[28px] bg-white border border-[#273338]/08 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center mb-4">
                    <Car className="w-6 h-6 text-[#2B5748]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#182320] mb-2">Parking Facilities</h4>
                  <p className="text-xs sm:text-sm text-[#52605B] leading-relaxed">
                    Secure underground parking is situated nearby at <strong>Q-Park Oxford Street</strong> and <strong>Cavendish Square</strong>, offering pre-bookable vehicle bays.
                  </p>
                </div>
              </div>

              <div className="p-7 rounded-[28px] bg-white border border-[#273338]/08 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#2B5748]/10 text-[#2B5748] flex items-center justify-center mb-4">
                    <Navigation className="w-6 h-6 text-[#2B5748]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#182320] mb-2">Step-Free Accessibility</h4>
                  <p className="text-xs sm:text-sm text-[#52605B] leading-relaxed">
                    Our Harley Street practice features step-free street level access, spacious corridors, and elevator access to all treatment and consultation suites.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Patient FAQ Accordion Section */}
        <section className="contact-faq-section py-24 bg-[#FBFBF9] text-[#273338]">
          <div className="container">
            <div className="title-box text-center max-w-3xl mx-auto mb-14">
              <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">Patient Support</span>
              <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-[#4E5B55] text-sm sm:text-base max-w-2xl mx-auto">
                Quick answers regarding appointments, first visits, pricing, insurance, and clinic directions.
              </p>
            </div>

            <ContactFaqAccordion />
          </div>
        </section>

        {/* Contact Bottom CTA Section */}
        <section className="contact-cta relative py-24 bg-[#1B2623] text-white overflow-hidden">
          {/* Ambient Glow & Texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

          <div className="container relative z-10 text-center">
            <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#B5C89B]" />
                <span>Patient Concierge Service</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
                We Look Forward to <br className="hidden sm:inline" />
                <i className="font-serif text-[#B5C89B]">Welcoming You to Our Clinic.</i>
              </h2>

              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                Book your consultation online or get in touch with our concierge team to schedule your personalized dental appointment.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider !text-white text-white shadow-[0_8px_24px_rgba(43,87,72,0.4)] hover:shadow-[0_12px_32px_rgba(43,87,72,0.6)] transition-all duration-300 hover:scale-105 border border-[#9CB080]/30"
                  style={{ color: "#ffffff" }}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Book Consultation Online</span>
                </Link>

                <a
                  href={`tel:${phoneClean}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-8 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider !text-white text-white border border-white/25 hover:border-white/50 backdrop-blur-md transition-all duration-300 hover:scale-105"
                  style={{ color: "#ffffff" }}
                >
                  <Phone className="w-4 h-4 text-[#B5C89B]" />
                  <span>Call {phone}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
