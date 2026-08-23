import Image from "next/image";
import { Phone } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { BOOKING_CTA_IMAGE, imageSrc } from "@/lib/marketing-images";

export function BookingCtaBand({ phone }: { phone: string | null }) {
  return (
    <section className="relative isolate overflow-hidden py-20 lg:py-28">
      <Image
        src={imageSrc(BOOKING_CTA_IMAGE, 2000)}
        alt={BOOKING_CTA_IMAGE.alt}
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-secondary/90" aria-hidden />

      <div className={CONTAINER}>
        <ScrollReveal className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center text-secondary-foreground">
          <h2 className="font-serif text-display-section text-balance">
            Ready to take the first step?
          </h2>
          <p className="max-w-xl text-secondary-foreground/80">
            Book online in a couple of clicks, or call us — we&apos;re happy to
            talk through your options first.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/book" size="lg" className="h-12 gap-2 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90">
              Book an Appointment
            </ButtonLink>
            {phone && (
              <ButtonLink
                href={`tel:${phone}`}
                size="lg"
                variant="outline"
                className="h-12 gap-2 border-white/30 bg-white/5 px-8 text-base text-secondary-foreground hover:bg-white/15"
              >
                <Phone className="size-4" />
                {phone}
              </ButtonLink>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
