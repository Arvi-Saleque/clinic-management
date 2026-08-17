"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvailabilityPanel } from "@/components/marketing/availability-panel";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
}
interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

/**
 * Replaces a persistently-visible booking panel with an elegant trigger
 * that opens the same panel full-screen. Keeps the hero photo uncluttered
 * while making the booking flow feel like a considered, premium moment
 * rather than a form bolted onto the page.
 */
export function AvailabilityDialog({
  services,
  practitioners,
  className,
}: {
  services: Service[];
  practitioners: Practitioner[];
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        render={
          <motion.button
            type="button"
            className={cn(
              "group flex items-center gap-3 rounded-full border border-white/25 bg-white/10 py-2.5 pl-3 pr-5 text-left text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-lg transition-colors hover:bg-white/15",
              className,
            )}
            animate={
              shouldReduceMotion
                ? undefined
                : { boxShadow: ["0 0 0 0 rgba(49,199,178,0.35)", "0 0 0 14px rgba(49,199,178,0)"] }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        }
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:scale-105">
          <CalendarClock className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Find a time that works for you</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
            <span className="size-1.5 rounded-full bg-success" />
            Live availability — check now
          </span>
        </span>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:p-8">
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] shadow-2xl"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-accent/30 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden />

            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10 text-white hover:bg-white/15 hover:text-white" />}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-10 md:grid-cols-[0.9fr_1.1fr] md:p-14">
              <div className="flex flex-col justify-center text-white">
                <DialogPrimitive.Title className="font-serif text-display-section text-balance">
                  Let&apos;s find your moment.
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-4 max-w-sm text-white/80">
                  Pick a treatment, a practitioner, and a time — we&apos;ll hold it while
                  you create your account to confirm.
                </DialogPrimitive.Description>
              </div>

              <div className="rounded-3xl bg-surface-elevated p-6 shadow-xl sm:p-8">
                <AvailabilityPanel services={services} practitioners={practitioners} variant="embedded" />
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
