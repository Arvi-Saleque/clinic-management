import { HeartHandshake, MessageCircleHeart, ScanLine, Users } from "lucide-react";

import { ScrollReveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";

const BENEFITS = [
  {
    icon: Users,
    title: "Experienced Clinicians",
    description: "Highly trained professionals focused on you.",
  },
  {
    icon: MessageCircleHeart,
    title: "Clear & Honest Care",
    description: "We explain every option and respect your choices.",
  },
  {
    icon: ScanLine,
    title: "Advanced Technology",
    description: "Modern tools for precise diagnosis and comfort.",
  },
  {
    icon: HeartHandshake,
    title: "Comfort at Every Step",
    description: "A calm environment and gentle approach.",
  },
];

export function BenefitsSection() {
  return (
    <section className="w-full bg-primary-soft py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why patients choose us
          </p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            Care you can <span className="text-primary">trust.</span>
          </h2>
        </ScrollReveal>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
