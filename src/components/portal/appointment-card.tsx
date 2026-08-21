"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  LayoutDashboard,
  Loader2,
  Pill,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelOwnAppointmentAction } from "@/lib/server/booking";
import { cn } from "@/lib/utils";

export interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface PrescriptionSummary {
  id: string;
  issued_at: string;
  status: string;
  notes: string | null;
  practitionerName?: string;
  prescription_items: PrescriptionItem[];
}

export interface AppointmentCardProps {
  id: string;
  starts_at: string;
  ends_at?: string;
  status: string;
  practitionerName: string;
  serviceName: string;
  price: number;
  duration?: number;
  notes?: string | null;
  prescription?: PrescriptionSummary | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-warning/20 bg-warning/10 text-warning",
  confirmed: "border-primary/20 bg-primary-soft text-primary",
  checked_in: "border-accent/20 bg-accent/15 text-primary",
  completed: "border-success/20 bg-success/10 text-success",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  no_show: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function AppointmentCard(props: AppointmentCardProps) {
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelStep, setCancelStep] = React.useState<1 | 2 | 3>(1);
  const [confirmedIrreversible, setConfirmedIrreversible] = React.useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = React.useState(false);

  const canChange = ["pending", "confirmed"].includes(props.status) && new Date(props.starts_at) > new Date();
  const hasPrescription = Boolean(props.prescription && props.prescription.prescription_items?.length);

  // Reset dialog state when opening/closing
  function handleOpenCancelDialog(open: boolean) {
    setCancelDialogOpen(open);
    if (open) {
      setCancelStep(1);
      setConfirmedIrreversible(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    const { error } = await cancelOwnAppointmentAction(props.id, "Cancelled by patient");
    setCancelling(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Appointment successfully cancelled.");
      setCancelStep(3); // Show confirmation modal screen
    }
  }

  const date = new Date(props.starts_at);

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl shadow-md transition-all hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5">
      <div className="grid md:grid-cols-[160px_1fr]">
        {/* Left Date Sidebar */}
        <div className="flex items-center gap-4 border-b border-border/60 bg-background-subtle/60 backdrop-blur-md p-5 sm:p-6 md:flex-col md:justify-center md:border-b-0 md:border-r md:text-center">
          <div className="flex size-16 md:size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20 md:mx-auto">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-primary-foreground/80">
              {format(date, "MMM")}
            </span>
            <span className="font-heading text-2xl md:text-3xl font-extrabold leading-none tracking-tight">
              {format(date, "dd")}
            </span>
          </div>
          <div className="md:mt-1.5">
            <p className="text-sm font-bold text-foreground">{format(date, "EEEE")}</p>
            <p className="mt-0.5 text-xs text-text-muted">{format(date, "yyyy")}</p>
          </div>
        </div>

        {/* Right Content */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold text-foreground">{props.serviceName}</h2>
                <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5 shadow-2xs", STATUS_STYLE[props.status])}>
                  {props.status === "no_show"
                    ? "No show"
                    : props.status === "checked_in"
                      ? "Checked in"
                      : props.status.charAt(0).toUpperCase() + props.status.slice(1).replaceAll("_", " ")}
                </Badge>
              </div>

              {/* Meta Chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background-subtle/80 px-3 py-1.5 font-medium text-foreground">
                  <Clock3 className="size-3.5 text-primary" />
                  {format(date, "h:mm a")}
                  {props.ends_at ? ` – ${format(new Date(props.ends_at), "h:mm a")}` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background-subtle/80 px-3 py-1.5 font-medium text-foreground">
                  <Stethoscope className="size-3.5 text-primary" />
                  {props.practitionerName}
                </span>
                {props.duration && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background-subtle/80 px-3 py-1.5 text-text-muted">
                    <CalendarClock className="size-3.5 text-primary" />
                    {props.duration} minutes
                  </span>
                )}
              </div>

              {props.notes && (
                <div className="flex items-start gap-2 rounded-2xl border border-border/60 bg-background-subtle/80 p-3.5 text-xs text-text-secondary">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{props.notes}</span>
                </div>
              )}
            </div>

            <div className="text-left sm:text-right shrink-0 rounded-2xl border border-border/60 bg-background-subtle/60 p-3 sm:px-4 sm:py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Service fee</p>
              <p className="mt-0.5 font-heading text-xl font-extrabold text-foreground">
                €{Number(props.price).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action Row */}
          {(canChange || hasPrescription) && (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-4">
              {/* View Prescription Button */}
              {hasPrescription && props.prescription && (
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="gap-2 rounded-2xl border-primary/30 bg-primary-soft/50 font-bold text-xs text-primary hover:bg-primary-soft h-9.5 px-4 shadow-2xs"
                      />
                    }
                  >
                    <Pill className="size-4" /> View Prescription
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 font-heading text-xl">
                        <Pill className="size-5 text-primary" /> Prescription Details
                      </DialogTitle>
                      <DialogDescription>
                        Issued on {format(new Date(props.prescription.issued_at), "MMMM d, yyyy")} by{" "}
                        {props.prescription.practitionerName || props.practitionerName}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-3">
                        {props.prescription.prescription_items.map((item, idx) => (
                          <div key={item.id || idx} className="rounded-2xl border border-border bg-background-subtle/70 p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">{item.medicine_name}</p>
                                <p className="mt-0.5 text-xs text-text-secondary">
                                  {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") ||
                                    "As directed by doctor"}
                                </p>
                                {item.instructions && (
                                  <div className="mt-2.5 rounded-xl border border-border/60 bg-surface p-2.5 text-xs text-text-muted">
                                    <strong className="text-foreground">Instructions: </strong>
                                    {item.instructions}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {props.prescription.notes && (
                        <div className="rounded-2xl border border-border p-3.5 text-xs text-text-secondary">
                          <strong className="text-foreground">Clinical Note: </strong>
                          {props.prescription.notes}
                        </div>
                      )}

                      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                          <strong>Safety reminder:</strong> Please take all medications strictly as prescribed. Contact the
                          clinic if you experience unusual side effects.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {canChange && (
                <>
                  {/* Reschedule Button */}
                  <ButtonLink
                    href={`/portal/appointments/book?reschedule=${props.id}`}
                    variant="outline"
                    className="gap-2 rounded-2xl border-border bg-surface text-xs font-semibold hover:border-primary hover:bg-primary-soft/40 h-9.5 px-4 shadow-2xs"
                  >
                    <RefreshCw className="size-3.5" /> Reschedule Visit
                  </ButtonLink>

                  {/* Cancel Appointment Button & DOUBLE-CONFIRMATION MODAL */}
                  <Dialog open={cancelDialogOpen} onOpenChange={handleOpenCancelDialog}>
                    <DialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          className="gap-1.5 rounded-2xl border border-destructive/20 bg-destructive/5 text-xs font-semibold text-destructive hover:bg-destructive/10 h-9.5 px-4 shadow-2xs"
                        />
                      }
                    >    
                      <XCircle className="size-3.5" /> Cancel Visit
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] w-full relative overflow-hidden rounded-[32px] border border-border/80 bg-surface p-6 sm:p-7 shadow-2xl">
                      {/* Ambient Soft Glow */}
                      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-destructive/10 blur-3xl" />
                      <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-emerald-500/10 blur-3xl" />

                      {/* 2-Step Progress Header (Only on steps 1 & 2) */}
                      {cancelStep !== 3 && (
                        <div className="flex items-center justify-center gap-2.5 pb-1">
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all",
                              cancelStep === 1
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs"
                                : "bg-background-subtle text-text-muted",
                            )}
                          >
                            <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-extrabold">1</span>
                            <span>Review Details</span>
                          </div>
                          <span className="text-text-muted text-xs font-bold">&rarr;</span>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all",
                              cancelStep === 2
                                ? "bg-destructive/15 text-destructive border border-destructive/30 shadow-xs"
                                : "bg-background-subtle text-text-muted",
                            )}
                          >
                            <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-extrabold">2</span>
                            <span>Final Confirmation</span>
                          </div>
                        </div>
                      )}

                      {/* ── STEP 1: REVIEW DETAILS & RESCHEDULE OPTION ── */}
                      {cancelStep === 1 && (
                        <div className="space-y-4 pt-1">
                          <div className="text-center space-y-1.5">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm">
                              <AlertTriangle className="size-7 stroke-[2.25]" />
                            </div>
                            <DialogTitle className="font-heading text-xl font-extrabold text-foreground">
                              Cancel This Appointment?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-secondary max-w-sm mx-auto">
                              Please review your booking details before proceeding.
                            </DialogDescription>
                          </div>

                          {/* Appointment Summary Box */}
                          <div className="rounded-2xl border border-border/80 bg-background-subtle p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between font-bold text-foreground text-sm border-b border-border/60 pb-2">
                              <span>{props.serviceName}</span>
                              <span className="text-primary font-semibold">€{Number(props.price).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                              <CalendarClock className="size-3.5 text-primary shrink-0" />
                              <span>{format(date, "EEEE, MMMM d, yyyy")} &middot; {format(date, "HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                              <Stethoscope className="size-3.5 text-primary shrink-0" />
                              <span>Doctor: {props.practitionerName}</span>
                            </div>
                          </div>

                          {/* Friendly Alternative: Reschedule Banner */}
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-3 text-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-foreground">Need a different time instead?</p>
                              <p className="text-[11px] text-text-muted">You can easily reschedule without losing your booking.</p>
                            </div>
                            <ButtonLink
                              href={`/portal/appointments/book?reschedule=${props.id}`}
                              size="sm"
                              className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover shrink-0 gap-1.5 shadow-xs h-9 px-3.5"
                            >
                              <RefreshCw className="size-3" /> Reschedule
                            </ButtonLink>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-border/60">
                            <DialogClose
                              render={
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-semibold border-border"
                                />
                              }
                            >
                              Keep Appointment
                            </DialogClose>
                            <Button
                              type="button"
                              className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold gap-1.5 bg-destructive text-white hover:bg-destructive/90 shadow-md shadow-destructive/20"
                              onClick={() => setCancelStep(2)}
                            >
                              Proceed to Cancel <ArrowRight className="size-3.5 text-white" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ── STEP 2: DOUBLE CONFIRMATION ── */}
                      {cancelStep === 2 && (
                        <div className="space-y-4 pt-1">
                          <div className="text-center space-y-1.5">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/15 text-destructive shadow-lg shadow-destructive/20 animate-pulse">
                              <ShieldAlert className="size-7 stroke-[2.25]" />
                            </div>
                            <DialogTitle className="font-heading text-xl font-extrabold text-destructive">
                              Double Confirmation Required
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-secondary max-w-sm mx-auto">
                              Please review and confirm to permanently cancel this visit.
                            </DialogDescription>
                          </div>

                          {/* High-Alert Warning Notice Box */}
                          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive leading-relaxed space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-sm">
                              <XCircle className="size-4 shrink-0" /> Permanent Cancellation Notice
                            </div>
                            <p className="text-text-secondary text-[11px] leading-relaxed">
                              Your reserved chair on <strong className="text-foreground">{format(date, "EEEE, MMMM d, yyyy")} at {format(date, "HH:mm")}</strong> for <strong className="text-foreground">{props.serviceName}</strong> with <strong className="text-foreground">{props.practitionerName}</strong> will be permanently released to other patients.
                            </p>
                          </div>

                          {/* Interactive Double-Confirmation Checkbox Card */}
                          <label
                            className={cn(
                              "flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all duration-200",
                              confirmedIrreversible
                                ? "border-destructive bg-destructive/10 shadow-xs ring-1 ring-destructive/30"
                                : "border-border/80 bg-background-subtle hover:border-destructive/40",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={confirmedIrreversible}
                              onChange={(e) => setConfirmedIrreversible(e.target.checked)}
                              className="mt-0.5 size-4 rounded text-destructive accent-destructive cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-foreground select-none leading-relaxed">
                              I understand that this cancellation is irreversible and my reserved appointment will be permanently removed.
                            </span>
                          </label>

                          {/* Actions */}
                          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-border/60">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={cancelling}
                              onClick={() => setCancelStep(1)}
                              className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-semibold gap-1.5 border-border"
                            >
                              <ChevronLeft className="size-3.5" /> Back to Options
                            </Button>
                            <Button
                              type="button"
                              disabled={!confirmedIrreversible || cancelling}
                              onClick={handleCancel}
                              className={cn(
                                "w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold gap-2 bg-destructive text-white shadow-lg shadow-destructive/25 transition-all",
                                confirmedIrreversible ? "hover:bg-destructive/90 cursor-pointer" : "opacity-45 cursor-not-allowed",
                              )}
                            >
                              {cancelling ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin text-white" /> Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-3.5 text-white stroke-[2.25]" /> Confirm Cancellation
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ── STEP 3: POST-CANCELLATION CONFIRMATION MODAL ── */}
                      {cancelStep === 3 && (
                        <div className="space-y-4 pt-1 text-center">
                          {/* Animated Success Badge */}
                          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/15">
                            <CheckCircle2 className="size-8 stroke-[2.25]" />
                          </div>

                          <div className="space-y-1">
                            <DialogTitle className="font-heading text-xl sm:text-2xl font-extrabold text-foreground">
                              Appointment Cancelled
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                              Your dental visit has been successfully cancelled and removed from your active schedule.
                            </DialogDescription>
                          </div>

                          {/* Highlights Box */}
                          <div className="rounded-2xl border border-border/80 bg-background-subtle p-3.5 text-left space-y-2.5 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CalendarX className="size-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">Chair & Slot Released</p>
                                <p className="text-[11px] text-text-muted">Your reserved time is now cleared from our clinical calendar.</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                <ShieldCheck className="size-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">Patient Record Updated</p>
                                <p className="text-[11px] text-text-muted">Your records have been updated with zero cancellation fee.</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                <Stethoscope className="size-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">Rebook Anytime</p>
                                <p className="text-[11px] text-text-muted">You can schedule a new care visit whenever you are ready.</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-semibold border-border"
                              onClick={() => setCancelDialogOpen(false)}
                            >
                              Close
                            </Button>
                            <ButtonLink
                              href="/portal/appointments/book"
                              className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20"
                              onClick={() => setCancelDialogOpen(false)}
                            >
                              Book an Appointment
                            </ButtonLink>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
