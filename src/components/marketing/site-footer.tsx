import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Stethoscope } from "lucide-react";

import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

const PATIENT_LINKS = [
  { href: "/book", label: "Book an Appointment" },
  { href: "/login", label: "Patient Portal" },
  { href: "/#faq", label: "FAQs" },
];

const CLINIC_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/practitioners", label: "Practitioners" },
  { href: "/contact", label: "Contact Us" },
];

interface Branch {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}
interface TreatmentLink {
  href: string;
  label: string;
}

export function SiteFooter({ branch, treatments }: { branch: Branch | null; treatments: TreatmentLink[] }) {
  const COLUMNS = [
    {
      title: "Treatments",
      links: [{ href: "/services", label: "All Treatments" }, ...treatments.slice(0, 3)],
    },
    { title: "Patients", links: PATIENT_LINKS },
    { title: "Clinic", links: CLINIC_LINKS },
  ];

  return (
    <ScrollReveal amount={0.1}>
      <footer className="bg-secondary text-secondary-foreground">
        <div className={cn(CONTAINER, "grid gap-10 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]")}>
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-serif text-xl">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="size-5" />
              </span>
              Clinic Care
            </Link>
            <p className="max-w-xs text-sm text-secondary-foreground/70">
              Personalised dental care in a calm, modern clinic. We&apos;re here for
              you and your smile.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
              <MessageCircle className="size-4" />
              <span>WhatsApp support available during clinic hours</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="font-serif text-base">{col.title}</p>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-secondary-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3">
            <p className="font-serif text-base">Clinic Details</p>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              {branch?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{branch.address}</span>
                </li>
              )}
              {branch?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <a href={`tel:${branch.phone}`} className="hover:text-secondary-foreground">
                    {branch.phone}
                  </a>
                </li>
              )}
              {branch?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" />
                  <a href={`mailto:${branch.email}`} className="hover:text-secondary-foreground">
                    {branch.email}
                  </a>
                </li>
              )}
              {!branch && <li>Contact details coming soon.</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <div className={cn(CONTAINER, "flex flex-col items-center justify-between gap-3 text-xs text-secondary-foreground/60 sm:flex-row")}>
            <p>&copy; {new Date().getFullYear()} Clinic Care. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-secondary-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-secondary-foreground">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-secondary-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </ScrollReveal>
  );
}
