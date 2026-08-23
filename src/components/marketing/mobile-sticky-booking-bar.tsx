import { Phone } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

/** Fixed bottom bar, mobile only — keeps booking one thumb-tap away on long scrolling pages. */
export function MobileStickyBookingBar({ phone }: { phone: string | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-surface-elevated/95 p-3 backdrop-blur-lg [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      {phone && (
        <ButtonLink
          href={`tel:${phone}`}
          variant="outline"
          size="lg"
          className="h-12 w-12 shrink-0 px-0"
          aria-label={`Call ${phone}`}
        >
          <Phone className="size-5" />
        </ButtonLink>
      )}
      <ButtonLink href="/book" size="lg" className="h-12 flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
        Book an Appointment
      </ButtonLink>
    </div>
  );
}
