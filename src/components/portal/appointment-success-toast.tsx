"use client";

import * as React from "react";
import {
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AppointmentSuccessToast({ success }: { success?: string }) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"booked" | "rescheduled" | "cancelled" | null>(null);

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
    } else if (success === "cancelled") {
      setType("cancelled");
      setOpen(true);
      toast.success("Appointment cancelled successfully.");
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
  const isCancelled = type === "cancelled";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] w-full relative overflow-hidden rounded-[32px] border border-border/80 bg-surface p-6 sm:p-7 shadow-2xl">
        {/* Ambient Soft Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="text-center space-y-4 pt-1">
          {/* Animated Success Badge */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/15">
            <CheckCircle2 className="size-8 stroke-[2.25]" />
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="font-heading text-xl sm:text-2xl font-extrabold text-foreground text-center">
              {isCancelled
                ? "Appointment Cancelled"
                : isRescheduled
                  ? "Appointment Rescheduled!"
                  : "Appointment Confirmed!"}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed text-center">
              {isCancelled
                ? "Your dental visit has been successfully cancelled and removed from your active schedule."
                : isRescheduled
                  ? "Your dental visit has been successfully updated in our clinical calendar."
                  : "Your dental care visit has been securely scheduled at our clinical sanctuary."}
            </DialogDescription>
          </DialogHeader>

          {/* Highlights Box */}
          <div className="rounded-2xl border border-border/80 bg-background-subtle p-3.5 text-left space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {isCancelled ? <CalendarX className="size-3.5" /> : <CalendarCheck className="size-3.5" />}
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {isCancelled ? "Chair & Slot Released" : "Instant Calendar Lock"}
                </p>
                <p className="text-[11px] text-text-muted">
                  {isCancelled
                    ? "Your reserved time is now cleared from our clinical calendar."
                    : "Your preferred chair and slot are officially reserved."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <ShieldCheck className="size-3.5" />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {isCancelled ? "Patient Record Updated" : "Assigned Practitioner"}
                </p>
                <p className="text-[11px] text-text-muted">
                  {isCancelled
                    ? "Your records have been updated with zero cancellation fee."
                    : "Your doctor has been notified and prepared for this visit."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Stethoscope className="size-3.5" />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {isCancelled ? "Rebook Anytime" : "Private Health Record"}
                </p>
                <p className="text-[11px] text-text-muted">
                  {isCancelled
                    ? "You can schedule a new care visit whenever you are ready."
                    : "All details are securely stored in your patient portal."}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            {isCancelled ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-semibold border-border"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <ButtonLink
                  href="/portal/appointments/book"
                  className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20"
                  onClick={() => setOpen(false)}
                >
                  Book an Appointment
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink
                  href="/portal/dashboard"
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-semibold gap-1.5 border-border"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="size-3.5" /> Overview
                </ButtonLink>
                <Button
                  className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20"
                  onClick={() => setOpen(false)}
                >
                  View My Visits
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
