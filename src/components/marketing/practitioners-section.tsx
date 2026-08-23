import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ScrollReveal, StaggerGroup, StaggerItem, TiltCard } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { pickFromPool, PRACTITIONER_PHOTO_FALLBACKS } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

export interface PractitionerCardData {
  id: string;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  photo_url: string | null;
  profiles: { full_name: string } | null;
}

export function PractitionersSection({ practitioners }: { practitioners: PractitionerCardData[] }) {
  const centered = practitioners.length <= 2;

  return (
    <section className="w-full py-24 lg:py-32">
      <div className={CONTAINER}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Our practitioners</p>
            <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
              Meet our <span className="text-primary">specialists.</span>
            </h2>
          </ScrollReveal>
          <Link
            href="/practitioners"
            className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover sm:flex"
          >
            View all practitioners
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <StaggerGroup
          className={cn(
            "mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2",
            centered ? "mx-auto max-w-3xl justify-items-center lg:grid-cols-2" : "lg:grid-cols-3",
          )}
        >
          {practitioners.map((p) => {
            const name = p.profiles?.full_name ?? "Practitioner";
            const image = p.photo_url
              ? { src: p.photo_url, alt: name }
              : { ...pickFromPool(PRACTITIONER_PHOTO_FALLBACKS, p.id), alt: name };

            return (
              <StaggerItem key={p.id} className="w-full max-w-sm">
                <TiltCard maxTilt={5} lift={false} className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10">
                    <div className="relative aspect-[4/5] w-full overflow-hidden">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif text-xl text-foreground">{name}</h3>
                      {p.title && <p className="text-sm text-text-secondary">{p.title}</p>}
                      {p.specialties && p.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.specialties.slice(0, 2).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 flex gap-2">
                        <ButtonLink href="/book" size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                          Book
                        </ButtonLink>
                        <ButtonLink href={`/practitioners/${p.id}`} size="sm" variant="outline" className="flex-1">
                          View profile
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/practitioners" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            View all practitioners
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
