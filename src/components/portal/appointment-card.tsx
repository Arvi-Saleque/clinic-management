"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock,
  Clock3,
  ExternalLink,
  FileHeart,
  FileText,
  Info,
  LayoutDashboard,
  Loader2,
  Lock,
  MessageSquare,
  Pill,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
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
  created_at?: string | null;
}

export interface PrescriptionRecord {
  id: string;
  issued_at: string;
  status: string;
  notes: string | null;
  practitionerName?: string;
  prescription_items: PrescriptionItem[];
}

export interface EncounterDetails {
  id?: string;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  performed_treatment?: string | null;
  patient_notes?: string | null;
  private_notes?: string | null;
  follow_up_recommended?: boolean | null;
  follow_up_date?: string | null;
  follow_up_reason?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  status?: string | null;
}

export interface PrescriptionSummary {
  id: string;
  issued_at: string;
  status: string;
  notes: string | null;
  practitionerName?: string;
  prescription_items: PrescriptionItem[];
  prescriptions?: PrescriptionRecord[];
  encounter?: EncounterDetails | null;
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

  const rxList: PrescriptionRecord[] = React.useMemo(() => {
    if (props.prescription?.prescriptions && props.prescription.prescriptions.length > 0) {
      return props.prescription.prescriptions;
    }
    if (
      props.prescription &&
      props.prescription.prescription_items &&
      props.prescription.prescription_items.length > 0
    ) {
      return [
        {
          id: props.prescription.id,
          issued_at: props.prescription.issued_at,
          status: props.prescription.status,
          notes: props.prescription.notes,
          practitionerName: props.prescription.practitionerName || props.practitionerName,
          prescription_items: props.prescription.prescription_items,
        },
      ];
    }
    return [];
  }, [props.prescription, props.practitionerName]);

  const hasPrescriptionItems = rxList.some((rx) => rx.prescription_items && rx.prescription_items.length > 0);
  const hasClinicalNotes = Boolean(
    props.prescription?.encounter?.diagnosis ||
      props.prescription?.encounter?.performed_treatment ||
      props.prescription?.encounter?.chief_complaint ||
      props.prescription?.encounter?.patient_notes ||
      props.prescription?.encounter?.private_notes ||
      props.prescription?.encounter?.follow_up_recommended ||
      props.prescription?.notes,
  );
  const hasPrescription = Boolean(props.prescription && (hasPrescriptionItems || hasClinicalNotes || rxList.length > 0));

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
                      : props.status === "in_progress"
                        ? "In consultation"
                        : props.status.charAt(0).toUpperCase() + props.status.slice(1)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-text-secondary font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5 text-primary" />
                  {format(date, "h:mm a")}
                  {props.duration ? ` · ${props.duration} mins` : ""}
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  Dr. {props.practitionerName}
                </span>
                {props.prescription && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-soft/80 border border-primary/20 px-2 py-0.5 rounded-md">
                    <Pill className="size-3" />
                    Prescription Issued
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
              {/* View Prescription Details Button */}
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
                    <Pill className="size-4 text-primary" /> Prescription &amp; Clinical Notes
                  </DialogTrigger>
                  <DialogContent className="rounded-[32px] sm:max-w-2xl border border-border/80 bg-surface/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
                    {/* Header Banner */}
                    <div className="border-b border-border/60 bg-background-subtle/80 p-6 sm:p-7 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20">
                            <Pill className="size-5.5" />
                          </div>
                          <div>
                            <DialogTitle className="font-heading text-xl sm:text-2xl font-extrabold text-foreground">
                              Prescription &amp; Consultation Record
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-secondary mt-0.5">
                              Issued by <strong className="text-foreground">{props.prescription.practitionerName || props.practitionerName}</strong> on{" "}
                              {format(new Date(props.prescription.issued_at), "MMMM d, yyyy · h:mm a")}
                            </DialogDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-bold px-2.5 py-1 rounded-xl shadow-2xs",
                              props.prescription.status === "active"
                                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "border-border/80 bg-muted/30 text-text-muted",
                            )}
                          >
                            {props.prescription.status === "active" ? "Active Record" : "Historical Record"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Content Body */}
                    <div className="space-y-6 p-6 sm:p-7 max-h-[68vh] overflow-y-auto pr-2">
                      {/* ========================================================= */}
                      {/* SECTION 1: PRESCRIPTIONS ISSUED THIS CONSULTATION         */}
                      {/* ========================================================= */}
                      <section className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-foreground">
                                Prescriptions Issued This Consultation
                              </h3>
                              <p className="text-[11px] text-text-muted">
                                Authoritative record of prescriptions issued during this clinical encounter.
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-primary/30 text-primary bg-primary-soft/50 rounded-lg px-2.5 py-1"
                          >
                            {rxList.length} {rxList.length === 1 ? "Prescription" : "Prescriptions"}
                          </Badge>
                        </div>

                        {rxList.length > 0 ? (
                          <div className="space-y-4">
                            {rxList.map((rx, rxIndex) => (
                              <div
                                key={rx.id || rxIndex}
                                className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all hover:border-primary/40"
                              >
                                {/* Rx Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                      <Pill className="size-3.5 text-primary" />
                                      Prescription #{rxIndex + 1}
                                    </span>
                                    <span className="text-[11px] text-text-muted">
                                      · Issued {format(new Date(rx.issued_at), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                  </div>

                                  {(rx.practitionerName || props.practitionerName) && (
                                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                                      <User className="size-3 text-primary" />
                                      <span>Dr. {rx.practitionerName || props.practitionerName}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Items Table */}
                                {rx.prescription_items && rx.prescription_items.length > 0 ? (
                                  <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface/90">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-border/50 bg-background-subtle/50 text-text-muted text-left text-[11px]">
                                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Medicine</th>
                                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Dosage</th>
                                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Frequency</th>
                                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Duration</th>
                                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Instructions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/40">
                                        {rx.prescription_items.map((item, itemIdx) => (
                                          <tr key={item.id || itemIdx} className="hover:bg-background-subtle/30 transition-colors">
                                            <td className="py-2.5 px-3 font-bold text-foreground">{item.medicine_name}</td>
                                            <td className="py-2.5 px-3 text-text-secondary font-medium">{item.dosage || "—"}</td>
                                            <td className="py-2.5 px-3 text-text-secondary font-medium">{item.frequency || "—"}</td>
                                            <td className="py-2.5 px-3 text-text-secondary font-medium">{item.duration || "—"}</td>
                                            <td className="py-2.5 px-3 text-text-secondary">{item.instructions || "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-xs text-text-muted italic py-2 text-center">
                                    No individual medicines listed under this prescription record.
                                  </div>
                                )}

                                {/* Prescription Notes */}
                                {rx.notes && (
                                  <div className="rounded-xl bg-primary-soft/30 border border-primary/20 p-3 text-xs text-text-secondary space-y-1">
                                    <p className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                                      <FileText className="size-3 text-primary" /> Doctor&apos;s Remarks:
                                    </p>
                                    <p className="italic leading-relaxed pl-4 whitespace-pre-wrap">&ldquo;{rx.notes}&rdquo;</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/80 bg-background-subtle/50 p-5 text-center text-xs text-text-muted">
                            <Pill className="size-5 mx-auto mb-1.5 text-text-muted/60" />
                            No pharmacological medications were prescribed for this procedure.
                          </div>
                        )}

                        {/* Medication Safety Box */}
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs">Medication Safety Guidelines</p>
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                              Please take all prescribed medications strictly as directed. Complete antibiotic courses in full even if symptoms subside. Contact the clinic immediately if you experience adverse side effects or allergic reactions.
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* ========================================================= */}
                      {/* SECTION 2: CLINICAL NOTES & TREATMENT                     */}
                      {/* ========================================================= */}
                      <section className="space-y-3.5 pt-4 border-t border-border/60">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <Stethoscope className="size-4 text-primary" /> Clinical Notes &amp; Treatment
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-primary/30 text-primary bg-primary-soft/50 rounded-lg px-2 py-0.5"
                          >
                            Consultation Record
                          </Badge>
                        </div>

                        {hasClinicalNotes ? (
                          <div className="space-y-3">
                            {/* 1. Patient Concerns & Symptoms */}
                            {props.prescription.encounter?.chief_complaint && (
                              <div className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 space-y-1.5 shadow-2xs">
                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                  <FileHeart className="size-3.5 text-primary" /> 1. Patient Concerns &amp; Symptoms
                                </div>
                                <div className="text-xs text-text-secondary leading-relaxed bg-surface/90 rounded-xl p-3 border border-border/50 whitespace-pre-wrap">
                                  {props.prescription.encounter.chief_complaint}
                                </div>
                              </div>
                            )}

                            {/* 2. Clinical Diagnosis (Dx) */}
                            {props.prescription.encounter?.diagnosis && (
                              <div className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 space-y-1.5 shadow-2xs">
                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                  <Stethoscope className="size-3.5 text-primary" /> 2. Clinical Findings &amp; Diagnosis (Dx)
                                </div>
                                <div className="text-xs text-text-secondary font-medium leading-relaxed bg-surface/90 rounded-xl p-3 border border-border/50 whitespace-pre-wrap">
                                  {props.prescription.encounter.diagnosis}
                                </div>
                              </div>
                            )}

                            {/* 3. Treatment Provided (Tx) */}
                            {props.prescription.encounter?.performed_treatment && (
                              <div className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 space-y-1.5 shadow-2xs">
                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                  <ClipboardList className="size-3.5 text-primary" /> 3. Treatment Provided (Tx)
                                </div>
                                <div className="text-xs text-text-secondary font-medium leading-relaxed bg-surface/90 rounded-xl p-3 border border-border/50 whitespace-pre-wrap">
                                  {props.prescription.encounter.performed_treatment}
                                </div>
                              </div>
                            )}

                            {/* 4. Post-Operative Advice & Instructions (POA) */}
                            {props.prescription.encounter?.patient_notes && (
                              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 space-y-1.5 shadow-2xs text-teal-900 dark:text-teal-200">
                                <div className="text-xs font-bold flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <MessageSquare className="size-3.5 text-teal-700 dark:text-teal-300" />
                                    4. Post-Operative Advice &amp; Instructions (POA)
                                  </span>
                                  <Badge className="border-teal-500/30 bg-teal-500/20 text-[10px] font-bold text-teal-800 dark:text-teal-200">
                                    Patient Care Plan
                                  </Badge>
                                </div>
                                <div className="text-xs leading-relaxed italic bg-surface/90 rounded-xl p-3 border border-teal-500/20 text-foreground whitespace-pre-wrap">
                                  &ldquo;{props.prescription.encounter.patient_notes}&rdquo;
                                </div>
                              </div>
                            )}

                            {/* 5. Private Clinician Notes */}
                            {(props.prescription.encounter?.private_notes || props.prescription.notes) && (
                              <div className="rounded-2xl border border-border/80 bg-background-subtle/80 p-4 space-y-1.5 shadow-2xs">
                                <div className="text-xs font-bold text-foreground flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <Lock className="size-3.5 text-primary" /> 5. Private Clinician Notes
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-semibold border-border/70 text-text-muted">
                                    Clinician Documentation
                                  </Badge>
                                </div>
                                <div className="text-xs text-text-secondary font-medium leading-relaxed bg-surface/90 rounded-xl p-3 border border-border/50 whitespace-pre-wrap">
                                  {props.prescription.encounter?.private_notes || props.prescription.notes}
                                </div>
                              </div>
                            )}

                            {/* Follow-Up & Recall Action if recommended */}
                            {props.prescription.encounter?.follow_up_recommended && (
                              <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4 space-y-2 shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-2">
                                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <CalendarClock className="size-3.5 text-primary" /> Follow-up &amp; Recall Recommended
                                  </div>
                                  <Badge className="bg-primary-soft text-primary border-primary/30 text-[10px] font-bold">
                                    Recall Recommended
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <p className="text-foreground font-medium">
                                    {props.prescription.encounter.follow_up_reason || "Clinical evaluation and healing check recommended."}
                                  </p>
                                  {props.prescription.encounter.follow_up_date && (
                                    <p className="text-text-muted">
                                      Target Review Date:{" "}
                                      <strong className="text-foreground">
                                        {format(new Date(`${props.prescription.encounter.follow_up_date}T00:00:00`), "MMMM d, yyyy")}
                                      </strong>
                                    </p>
                                  )}
                                  <div className="pt-1">
                                    <ButtonLink
                                      href="/portal/appointments/book"
                                      size="sm"
                                      className="rounded-xl text-xs font-bold gap-1.5 h-8.5 px-3.5 shadow-xs"
                                    >
                                      <CalendarClock className="size-3.5" /> Book Follow-up Visit
                                    </ButtonLink>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/80 bg-background-subtle/50 p-4 text-center text-xs text-text-muted">
                            <Stethoscope className="size-5 mx-auto mb-1.5 text-text-muted/60" />
                            No clinical notes recorded for this visit.
                          </div>
                        )}
                      </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-border/60 p-4 sm:px-6 bg-background-subtle/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <ShieldCheck className="size-4 text-primary shrink-0" />
                        <span>
                          Clinical Record &middot; Dr. {props.prescription.practitionerName || props.practitionerName}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => window.print()}
                          className="rounded-2xl text-xs font-semibold gap-1.5 h-9 px-4 border-border"
                        >
                          <Printer className="size-3.5" /> Print / Save
                        </Button>
                        <DialogClose
                          render={
                            <Button
                              type="button"
                              className="rounded-2xl text-xs font-bold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs"
                            >
                              Done
                            </Button>
                          }
                        />
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
                              <span>{format(date, "EEEE, MMMM d, yyyy")} &middot; {format(date, "h:mm a")}</span>
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
                              Your reserved chair on <strong className="text-foreground">{format(date, "EEEE, MMMM d, yyyy")} at {format(date, "h:mm a")}</strong> for <strong className="text-foreground">{props.serviceName}</strong> with <strong className="text-foreground">{props.practitionerName}</strong> will be permanently released to other patients.
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
