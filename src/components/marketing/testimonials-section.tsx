import Image from "next/image";
import { Quote, Star } from "lucide-react";

import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { imageSrc, TESTIMONIAL_AVATARS } from "@/lib/marketing-images";
import { testimonials } from "@/lib/mock-data";

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-current" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [featured, ...rest] = testimonials;
  const featuredAvatar = TESTIMONIAL_AVATARS[featured.name];

  return (
    <section id="stories" className="w-full py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Patient stories</p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            Real experiences, <span className="text-primary">real results.</span>
          </h2>
          <p className="mt-2 text-xs text-text-muted">
            Illustrative patient stories — replace with real, consented reviews before launch.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <ScrollReveal className="relative overflow-hidden rounded-3xl bg-secondary text-secondary-foreground">
            {featuredAvatar && (
              <div className="relative h-56 w-full sm:h-72">
                <Image
                  src={imageSrc(featuredAvatar, 1000)}
                  alt={featuredAvatar.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent" />
              </div>
            )}
            <div className="p-8">
              <Quote className="size-7 text-accent" />
              <p className="mt-4 text-balance font-serif text-xl text-secondary-foreground sm:text-2xl">
                &ldquo;{featured.quote}&rdquo;
              </p>
              <div className="mt-5">
                <Stars />
                <p className="mt-2 text-sm font-semibold text-secondary-foreground">{featured.name}</p>
                <p className="text-xs text-secondary-foreground/70">{featured.service}</p>
              </div>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-6">
            {rest.map((t) => {
              const avatar = TESTIMONIAL_AVATARS[t.name];
              return (
                <ScrollReveal key={t.name} className="flex-1 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <Stars />
                  <p className="mt-3 text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    {avatar && (
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-full">
                        <Image src={imageSrc(avatar, 150)} alt={avatar.alt} fill sizes="36px" className="object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-text-muted">{t.service}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
