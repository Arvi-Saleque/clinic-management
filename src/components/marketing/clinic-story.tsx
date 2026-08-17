import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { imageSrc, STORY_DETAIL_IMAGE, STORY_IMAGE } from "@/lib/marketing-images";

const BENEFITS = [
  "Every plan is explained in plain language before you decide",
  "One connected record across booking, treatment and follow-up",
  "Digital-first, so paperwork never slows down your visit",
  "The same calm, unhurried approach at every appointment",
];

export function ClinicStory() {
  return (
    <section className="w-full py-24 lg:py-32">
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <ScrollReveal direction="right" className="relative">
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl shadow-xl">
              <Image
                src={imageSrc(STORY_IMAGE, 1200)}
                alt={STORY_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-4 hidden w-44 overflow-hidden rounded-2xl border-4 border-background shadow-lg sm:block lg:-right-10">
              <Image
                src={imageSrc(STORY_DETAIL_IMAGE, 500)}
                alt={STORY_DETAIL_IMAGE.alt}
                width={220}
                height={160}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Our approach</p>
            <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
              Care that feels <span className="text-primary">considered.</span>
            </h2>
            <p className="mt-4 max-w-md text-text-secondary">
              We take the time to understand you, your goals and your concerns.
              Together, we create a plan that makes sense for your health, your
              life and your future.
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {benefit}
                </li>
              ))}
            </ul>

            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Discover our story
              <ArrowRight className="size-4" />
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
