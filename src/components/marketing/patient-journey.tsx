import { CalendarCheck, ClipboardList, HeartPulse, Search, UserPlus } from "lucide-react";

import { ScrollReveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";

const STEPS = [
  { icon: Search, title: "Discover", description: "Explore treatments and meet our team." },
  { icon: UserPlus, title: "Register", description: "Quick and easy digital registration." },
  { icon: CalendarCheck, title: "Book", description: "Choose a time that suits you." },
  { icon: ClipboardList, title: "Consult", description: "A personalised consultation." },
  { icon: HeartPulse, title: "Follow Up", description: "Ongoing care for lasting results." },
];

export function PatientJourney() {
  return (
    <section className="w-full bg-background-subtle py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="mx-auto max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your journey</p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            Simple steps to <span className="text-primary">exceptional care.</span>
          </h2>
        </ScrollReveal>

        {/* Desktop: connected horizontal timeline */}
        <StaggerGroup className="mt-16 hidden lg:grid lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <StaggerItem key={title} className="relative flex flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-7 h-px w-full border-t border-dashed border-border" aria-hidden />
              )}
              <div className="relative flex size-14 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-sm">
                <span className="absolute -top-2 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg text-foreground">{title}</h3>
              <p className="mt-1 max-w-36 text-xs text-text-secondary">{description}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Mobile/tablet: connected vertical timeline */}
        <StaggerGroup className="mt-12 flex flex-col gap-8 lg:hidden">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <StaggerItem key={title} className="relative flex gap-4">
              {i < STEPS.length - 1 && (
                <div className="absolute left-7 top-14 h-[calc(100%-1.5rem)] w-px border-l border-dashed border-border" aria-hidden />
              )}
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-sm">
                <span className="absolute -top-2 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-6" />
              </div>
              <div className="pt-2">
                <h3 className="font-serif text-lg text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
