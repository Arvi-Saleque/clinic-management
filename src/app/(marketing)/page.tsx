import { Hero } from "@/components/marketing/hero";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { ClinicStory } from "@/components/marketing/clinic-story";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PractitionersSection } from "@/components/marketing/practitioners-section";
import { PatientJourney } from "@/components/marketing/patient-journey";
import { TechnologySection } from "@/components/marketing/technology-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { BookingCtaBand } from "@/components/marketing/booking-cta-band";
import { LocationSection } from "@/components/marketing/location-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { getClinicInfo, listPublicPractitioners, listPublicServices } from "@/lib/server/marketing";

export default async function HomePage() {
  const [services, practitioners, { branch, hours }] = await Promise.all([
    listPublicServices(),
    listPublicPractitioners(),
    getClinicInfo(),
  ]);

  return (
    <>
      <Hero services={services} practitioners={practitioners} />
      <TrustStrip />
      <ClinicStory />
      <ServicesGrid services={services} />
      <BenefitsSection />
      <PractitionersSection practitioners={practitioners} />
      <PatientJourney />
      <TechnologySection />
      <TestimonialsSection />
      <BookingCtaBand phone={branch?.phone ?? null} />
      <LocationSection branch={branch} hours={hours} />
      <FaqSection />
    </>
  );
}
