import type { Metadata } from "next";
import Image from "next/image";
import { HeartPulse, ShieldCheck, Sparkles, Users } from "lucide-react";

import { CONTAINER } from "@/lib/layout";
import { ScrollReveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import { imageSrc, PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  {
    icon: HeartPulse,
    title: "Patient-first care",
    description: "Every treatment plan is explained clearly before you decide — no surprises, no jargon.",
  },
  {
    icon: ShieldCheck,
    title: "Modern & secure",
    description: "Your records, prescriptions, and history live in one connected, access-controlled system.",
  },
  {
    icon: Sparkles,
    title: "Comfortable experience",
    description: "From online booking to follow-up care, we've removed the friction from visiting the dentist.",
  },
  {
    icon: Users,
    title: "Experienced team",
    description: "Our practitioners bring years of combined experience across general and cosmetic dentistry.",
  },
];

const TEAM_PHOTO = { id: "1667133295315-820bb6481730", alt: "Dentist examining a patient" };

export default function AboutPage() {
  return (
    <>
      <PageBanner
        eyebrow="About us"
        title="Care built around you"
        description="A modern dental practice combining experienced clinicians with a connected digital experience."
        image={toImageProp(PAGE_BANNERS.about)}
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal direction="right" className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
              <Image
                src={imageSrc(TEAM_PHOTO, 1200)}
                alt={TEAM_PHOTO.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </ScrollReveal>
            <ScrollReveal direction="left">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Our story</p>
              <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">One continuous <span className="text-primary">relationship</span></h2>
              <p className="mt-4 text-muted-foreground">
                Clinic Care was built on a simple idea: booking, treatment, and follow-up should feel like one
                continuous relationship, not a series of disconnected visits. That means online booking that
                actually works, records your care team can see instantly, and communication that keeps you in
                the loop — before, during, and after every appointment.
              </p>
              <p className="mt-4 text-muted-foreground">
                Every clinician on our team combines clinical expertise with genuine patient-first bedside
                manner, so the experience feels as considered as the care itself.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="w-full bg-muted/30 py-20">
        <div className={CONTAINER}>
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">What we stand for</p>
            <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">Why patients stay with <span className="text-primary">us</span></h2>
          </ScrollReveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <StaggerItem key={value.title}>
                <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <value.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-heading font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>
    </>
  );
}
