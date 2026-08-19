"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AppointmentSuccessToast({ success }: { success?: string }) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"booked" | "rescheduled" | null>(null);

  React.useEffect(() => {
    if (!success) return;

    if (success === "booked") {
      setType("booked");
      setOpen(true);
      toast.success("Appointment booked successfully.");
    } else if (success === "rescheduled") {
      setType("rescheduled");
      setOpen(true);
      toast.success("Appointment rescheduled successfully.");
    }

    // Strip success parameter from URL so browser refresh does not re-trigger
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, [success]);

  if (!type) return null;

  const isRescheduled = type === "rescheduled";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface p-6 sm:p-8 max-w-lg shadow-2xl">
        {/* Ambient Soft Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="text-center space-y-4">
          {/* Animated Success Badge */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/15">
            <CheckCircle2 className="size-10 stroke-[2.25]" />
          </div>

          <DialogHeader className="text-center space-y-1.5">
            <DialogTitle className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground text-center">
              {isRescheduled ? "Appointment Rescheduled!" : "Appointment Confirmed!"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed text-center">
              {isRescheduled
                ? "Your dental visit has been successfully updated in our clinical calendar."
                : "Your dental care visit has been securely scheduled at our clinical sanctuary."}
            </DialogDescription>
          </DialogHeader>

          {/* Highlights Box */}
          <div className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 text-left space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="size-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">Instant Calendar Lock</p>
                <p className="text-[11px] text-text-muted">Your preferred chair and slot are officially reserved.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Stethoscope className="size-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">Assigned Practitioner</p>
                <p className="text-[11px] text-text-muted">Your doctor has been notified and prepared for this visit.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">Private Health Record</p>
                <p className="text-[11px] text-text-muted">All details are securely stored in your patient portal.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              className="w-full sm:flex-1 rounded-2xl bg-primary hover:bg-primary-hover py-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
              onClick={() => setOpen(false)}
            >
              View My Visits
            </Button>
            <ButtonLink
              href="/portal/dashboard"
              variant="outline"
              className="w-full sm:w-auto rounded-2xl border-border hover:bg-background-subtle py-5 text-sm font-semibold gap-2"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4" /> Overview
            </ButtonLink>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
