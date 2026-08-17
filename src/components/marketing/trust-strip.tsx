import { Award, CalendarClock, FileText, ShieldCheck } from "lucide-react";

import { ScrollReveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";

/**
 * Compact top-of-page trust strip. Every item here is a real, verifiable
 * fact about this system/practice — no invented patient counts, review
 * scores, or credentials (see AGENTS.md-adjacent project rule: don't
 * fabricate stats). Swap copy in this array, not the component, if the
 * clinic wants to lead with different facts.
 */
const TRUST_ITEMS = [
  { icon: Award, label: "Experienced Clinical Team" },
  { icon: FileText, label: "Transparent Treatment Plans" },
  { icon: ShieldCheck, label: "Digital Patient Records" },
  { icon: CalendarClock, label: "Flexible Appointments" },
];

export function TrustStrip() {
  return (
    <section className="w-full border-b border-border bg-surface py-6">
      <div className={CONTAINER}>
        <ScrollReveal>
          <StaggerGroup className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <StaggerItem key={label} className="flex items-center gap-2.5 text-sm font-medium text-text-secondary">
                <Icon className="size-4 text-primary" />
                {label}
              </StaggerItem>
            ))}
          </StaggerGroup>
        </ScrollReveal>
      </div>
    </section>
  );
}
