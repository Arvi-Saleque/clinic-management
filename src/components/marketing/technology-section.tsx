import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { COMFORT_IMAGE, imageSrc, TECHNOLOGY_IMAGE } from "@/lib/marketing-images";

export function TechnologySection() {
  return (
    <section className="w-full py-24 lg:py-32">
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal direction="up" className="group relative overflow-hidden rounded-3xl bg-secondary text-secondary-foreground">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={imageSrc(TECHNOLOGY_IMAGE, 1200)}
                alt={TECHNOLOGY_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary-foreground/70">
                Technology
              </p>
              <h3 className="mt-2 font-serif text-2xl text-secondary-foreground sm:text-3xl">
                Precision technology.
                <br />
                Better outcomes.
              </h3>
              <p className="mt-3 max-w-sm text-sm text-secondary-foreground/80">
                Digital imaging, guided treatment and advanced materials for
                accuracy and confidence.
              </p>
              <Link
                href="/services"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                Explore our technology
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1} className="group relative overflow-hidden rounded-3xl bg-primary-soft">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={imageSrc(COMFORT_IMAGE, 1200)}
                alt={COMFORT_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-soft via-primary-soft/50 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Comfort</p>
              <h3 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">
                A calm space,
                <br />
                designed for you.
              </h3>
              <p className="mt-3 max-w-sm text-sm text-text-secondary">
                Thoughtful design, gentle care and amenities that help you feel
                at ease.
              </p>
              <Link
                href="/about"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                See our clinic
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
