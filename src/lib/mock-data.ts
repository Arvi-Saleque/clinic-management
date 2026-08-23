/**
 * Placeholder content for the marketing site while the real `services` /
 * `practitioners` Supabase tables aren't wired up yet (build-sequence step
 * 11). Shape mirrors the eventual DB rows so swapping to real data later is
 * a data-fetch change, not a component rewrite.
 */

export interface MockService {
  slug: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  priceFrom: number;
}

export interface MockPractitioner {
  slug: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  initials: string;
}

export interface MockTestimonial {
  name: string;
  quote: string;
  service: string;
}

export const services: MockService[] = [
  {
    slug: "general-checkup",
    name: "General Check-up",
    category: "General",
    description: "Comprehensive oral health assessment with digital charting and personalised advice.",
    durationMinutes: 30,
    priceFrom: 65,
  },
  {
    slug: "teeth-cleaning",
    name: "Teeth Cleaning",
    category: "Hygiene",
    description: "Professional scaling and polishing to keep your smile healthy between visits.",
    durationMinutes: 45,
    priceFrom: 95,
  },
  {
    slug: "cosmetic-veneers",
    name: "Cosmetic Veneers",
    category: "Cosmetic",
    description: "Custom porcelain veneers designed around your face, in a natural-looking finish.",
    durationMinutes: 60,
    priceFrom: 950,
  },
  {
    slug: "root-canal",
    name: "Root Canal Therapy",
    category: "Restorative",
    description: "Pain-managed root canal treatment to save and restore a damaged tooth.",
    durationMinutes: 90,
    priceFrom: 650,
  },
  {
    slug: "orthodontics",
    name: "Orthodontic Consultation",
    category: "Orthodontics",
    description: "Assessment and treatment planning for braces or clear aligners.",
    durationMinutes: 40,
    priceFrom: 85,
  },
  {
    slug: "pediatric-dentistry",
    name: "Paediatric Dentistry",
    category: "Children",
    description: "Gentle, friendly dental care designed specifically for younger patients.",
    durationMinutes: 30,
    priceFrom: 55,
  },
];

export const practitioners: MockPractitioner[] = [
  {
    slug: "dr-charlotte-hughes",
    name: "Dr Charlotte Hughes",
    title: "Principal Dentist, BDS",
    specialties: ["Cosmetic Dentistry", "Veneers", "Whitening"],
    bio: "Over 12 years creating confident smiles with a gentle, detail-driven approach.",
    initials: "CH",
  },
  {
    slug: "dr-oliver-bennett",
    name: "Dr Oliver Bennett",
    title: "General and Restorative Dentist, BDS",
    specialties: ["Root Canal", "Fillings", "General Care"],
    bio: "Focused on comfortable, modern restorative dentistry for the whole family.",
    initials: "OB",
  },
];

export const testimonials: MockTestimonial[] = [
  {
    name: "Emma C.",
    quote:
      "Booking online took two minutes and the reminder texts meant I never missed a visit. The clinic itself feels calm and genuinely modern.",
    service: "Teeth Cleaning",
  },
  {
    name: "Daniel H.",
    quote:
      "My veneers consultation was so clearly explained — costs, timeline, everything upfront. No surprises, just a great result.",
    service: "Cosmetic Veneers",
  },
  {
    name: "Lucy W.",
    quote:
      "My son actually looks forward to his check-ups now. The staff are wonderful with kids.",
    service: "Paediatric Dentistry",
  },
];

export const trustStats = [
  { value: 12000, suffix: "+", label: "Patients treated" },
  { value: 98, suffix: "%", label: "Patient satisfaction" },
  { value: 15, suffix: "+", label: "Years combined experience" },
];
