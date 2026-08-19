"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  FileText,
  Pill,
  RefreshCw,
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
  DialogFooter,
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
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = React.useState(false);

  const canChange = ["pending", "confirmed"].includes(props.status) && new Date(props.starts_at) > new Date();
  const hasPrescription = Boolean(props.prescription && props.prescription.prescription_items?.length);

  async function handleCancel() {
    setCancelling(true);
    const { error } = await cancelOwnAppointmentAction(props.id, "Cancelled by patient");
    setCancelling(false);
    if (error) toast.error(error);
    else {
      toast.success("Appointment cancelled");
      setCancelDialogOpen(false);
    }
  }

  const date = new Date(props.starts_at);

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
      <div className="grid md:grid-cols-[150px_1fr]">
        <div className="flex items-center gap-4 border-b border-border bg-background-subtle p-5 md:block md:border-b-0 md:border-r md:text-center">
          <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm md:mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest">{format(date, "MMM")}</span>
            <span className="text-2xl font-bold leading-none">{format(date, "dd")}</span>
          </div>
          <div className="md:mt-3">
            <p className="text-sm font-semibold">{format(date, "EEEE")}</p>
            <p className="mt-0.5 text-xs text-text-muted">{format(date, "yyyy")}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-bold">{props.serviceName}</h2>
                <Badge variant="outline" className={cn("capitalize", STATUS_STYLE[props.status])}>
                  {props.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" />
                  {format(date, "HH:mm")}
                  {props.ends_at ? ` – ${format(new Date(props.ends_at), "HH:mm")}` : ""}
                </span>
                <span className="flex items-center gap-2">
                  <Stethoscope className="size-4 text-primary" />
                  {props.practitionerName}
                </span>
                {props.duration && (
                  <span className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-primary" />
                    {props.duration} minutes
                  </span>
                )}
              </div>
              {props.notes && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-background-subtle p-3 text-xs leading-5 text-text-muted">
                  <FileText className="mt-0.5 size-3.5 shrink-0" /> {props.notes}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-text-muted">Estimated fee</p>
              <p className="mt-1 text-lg font-bold">৳{Number(props.price).toLocaleString()}</p>
            </div>
          </div>

          {/* Action Row */}
          {(canChange || hasPrescription) && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {/* View Prescription Button for Previous / Completed Visits */}
              {hasPrescription && props.prescription && (
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="gap-2 rounded-xl border-primary/30 bg-primary-soft/40 font-semibold text-primary hover:bg-primary-soft"
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
                  <ButtonLink href={`/portal/appointments/book?reschedule=${props.id}`} variant="outline" className="gap-2">
                    <RefreshCw className="size-4" /> Reschedule
                  </ButtonLink>
                  <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogTrigger render={<Button variant="ghost" className="gap-2 text-destructive" />}>
                      <XCircle className="size-4" /> Cancel appointment
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel this appointment?</DialogTitle>
                        <DialogDescription>
                          {format(date, "EEEE, d MMMM 'at' HH:mm")} · {props.serviceName}. This action cannot be undone from the
                          portal.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>Keep appointment</DialogClose>
                        <Button variant="destructive" disabled={cancelling} onClick={handleCancel}>
                          {cancelling ? "Cancelling..." : "Yes, cancel"}
                        </Button>
                      </DialogFooter>
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
