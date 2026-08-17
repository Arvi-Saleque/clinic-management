"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { ParallaxLayer } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

interface PageBannerProps {
  eyebrow: string;
  title: string;
  description?: string;
  image: { src: string; alt: string };
  className?: string;
}

/**
 * Full-width, image-backed page header used on every non-home marketing
 * page (About, Services, Practitioners, Contact) so the site reads as one
 * consistent visual system instead of a homepage-only treatment.
 */
export function PageBanner({ eyebrow, title, description, image, className }: PageBannerProps) {
  return (
    <section className={cn("relative isolate flex min-h-[46vh] w-full items-end overflow-hidden", className)}>
      <ParallaxLayer speed={0.25} className="absolute inset-0 -z-10">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover"
        />
      </ParallaxLayer>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/50 to-black/20"
        aria-hidden
      />

      <div className={cn(CONTAINER, "pb-14 pt-32 text-white")}>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-sm font-semibold uppercase tracking-widest text-white/80"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 max-w-2xl font-heading text-4xl font-bold leading-[1.1] text-balance sm:text-5xl"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-xl text-white/85"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
