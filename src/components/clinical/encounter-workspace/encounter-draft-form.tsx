"use client";

import { forwardRef, useEffect, useImperativeHandle, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, addWeeks, format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  completeEncounterAction,
  saveEncounterDraftAction,
} from "@/lib/server/encounters";
import { createInstantEncounterInvoiceAction } from "@/lib/server/invoices";
import type {
  ClinicalEncounter,
  EncounterFollowUpSchedulingContext,
  EncounterWorkspaceAppointment,
  EncounterWorkspacePatient,
} from "@/types/clinical";
import { FollowUpAppointmentDialog } from "./follow-up-appointment-dialog";
import { InstantBillingDialog, type InstantBillingContext } from "./instant-billing-dialog";

export interface EncounterDraftFormRef {
  triggerComplete: () => void;
  saveDraft: () => void;
}

interface EncounterDraftFormProps {
  encounter: ClinicalEncounter;
  privateNotes: string | null;
  patient?: EncounterWorkspacePatient;
  appointment?: EncounterWorkspaceAppointment | null;
  followUpScheduling?: EncounterFollowUpSchedulingContext | null;
  onDirtyChange?: (isDirty: boolean) => void;
  onValidationFail?: () => void;
}

interface DraftSnapshot {
  chiefComplaint: string;
  diagnosis: string;
  performedTreatment: string;
  patientNotes: string;
  privateNotes: string;
  followUpRecommended: boolean;
  followUpDate: string;
  followUpReason: string;
}

export const EncounterDraftForm = forwardRef<EncounterDraftFormRef, EncounterDraftFormProps>(
  function EncounterDraftForm(
    {
      encounter,
      privateNotes: initialPrivateNotes,
      patient,
      appointment,
      followUpScheduling,
      onDirtyChange,
      onValidationFail,
    },
    ref,
  ) {
    const router = useRouter();
    const [isPendingSave, startSaveTransition] = useTransition();
    const [isCompleting, setIsCompleting] = useState(false);
    const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    // Initial form snapshot
    const initialSnapshot: DraftSnapshot = {
      chiefComplaint: encounter.chief_complaint ?? "",
      diagnosis: encounter.diagnosis ?? "",
      performedTreatment: encounter.performed_treatment ?? "",
      patientNotes: encounter.patient_notes ?? "",
      privateNotes: initialPrivateNotes ?? "",
      followUpRecommended: encounter.follow_up_recommended ?? false,
      followUpDate: encounter.follow_up_date ?? format(addWeeks(new Date(), 2), "yyyy-MM-dd"),
      followUpReason: encounter.follow_up_reason ?? "Review healing and symptoms",
    };

    const [savedSnapshot, setSavedSnapshot] = useState<DraftSnapshot>(initialSnapshot);
    const [chiefComplaint, setChiefComplaint] = useState(initialSnapshot.chiefComplaint);
    const [diagnosis, setDiagnosis] = useState(initialSnapshot.diagnosis);
    const [performedTreatment, setPerformedTreatment] = useState(initialSnapshot.performedTreatment);
    const [patientNotes, setPatientNotes] = useState(initialSnapshot.patientNotes);
    const [privateNotes, setPrivateNotes] = useState(initialSnapshot.privateNotes);
    const [followUpRecommended, setFollowUpRecommended] = useState(initialSnapshot.followUpRecommended);
    const [followUpDate, setFollowUpDate] = useState(initialSnapshot.followUpDate);
    const [followUpReason, setFollowUpReason] = useState(initialSnapshot.followUpReason);
    const [followUpInterval, setFollowUpInterval] = useState("2-weeks");
    const [reminderChannel, setReminderChannel] = useState("sms-email");

    const [lastSavedAt, setLastSavedAt] = useState<string>(encounter.updated_at);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Compute dirty state
    const isDirty =
      chiefComplaint !== savedSnapshot.chiefComplaint ||
      diagnosis !== savedSnapshot.diagnosis ||
      performedTreatment !== savedSnapshot.performedTreatment ||
      patientNotes !== savedSnapshot.patientNotes ||
      privateNotes !== savedSnapshot.privateNotes ||
      followUpRecommended !== savedSnapshot.followUpRecommended ||
      (followUpRecommended &&
        (followUpDate !== savedSnapshot.followUpDate ||
          followUpReason !== savedSnapshot.followUpReason));

    const isBusy = isPendingSave || isCompleting;

    // Protect against accidental exit
    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty && !isCompleting) {
          e.preventDefault();
          e.returnValue = "";
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty, isCompleting]);

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const handleIntervalChange = (val: string) => {
      setFollowUpInterval(val);
      const now = new Date();
      let nextDate = addWeeks(now, 2);
      if (val === "1-week") nextDate = addWeeks(now, 1);
      else if (val === "2-weeks") nextDate = addWeeks(now, 2);
      else if (val === "3-weeks") nextDate = addWeeks(now, 3);
      else if (val === "1-month") nextDate = addMonths(now, 1);
      else if (val === "3-months") nextDate = addMonths(now, 3);
      else if (val === "6-months") nextDate = addMonths(now, 6);
      setFollowUpDate(format(nextDate, "yyyy-MM-dd"));
    };

    const validateDraft = (): boolean => {
      const errors: Record<string, string> = {};
      if (chiefComplaint.length > 1000) errors.chiefComplaint = "Chief complaint must not exceed 1,000 characters.";
      if (diagnosis.length > 1000) errors.diagnosis = "Diagnosis must not exceed 1,000 characters.";
      if (performedTreatment.length > 1000) errors.performedTreatment = "Performed treatment must not exceed 1,000 characters.";
      if (patientNotes.length > 1000) errors.patientNotes = "Patient instructions must not exceed 1,000 characters.";
      if (privateNotes.length > 1000) errors.privateNotes = "Private notes must not exceed 1,000 characters.";
      if (followUpReason.length > 500) errors.followUpReason = "Follow-up reason must not exceed 500 characters.";

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const validateForCompletion = (): boolean => {
      const errors: Record<string, string> = {};
      if (!diagnosis.trim()) {
        errors.diagnosis = "Clinical diagnosis is required before completing the consultation.";
      }
      if (!performedTreatment.trim()) {
        errors.performedTreatment = "Performed treatment summary is required before completing the consultation.";
      }
      if (chiefComplaint.length > 1000) errors.chiefComplaint = "Chief complaint must not exceed 1,000 characters.";
      if (diagnosis.length > 1000) errors.diagnosis = "Diagnosis must not exceed 1,000 characters.";
      if (performedTreatment.length > 1000) errors.performedTreatment = "Performed treatment must not exceed 1,000 characters.";

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSaveDraft = () => {
      if (!validateDraft()) {
        toast.error("Please correct the validation errors before saving.");
        return;
      }

      startSaveTransition(async () => {
        const payload = {
          encounterId: encounter.id,
          chiefComplaint: chiefComplaint.trim() || null,
          diagnosis: diagnosis.trim() || null,
          performedTreatment: performedTreatment.trim() || null,
          patientNotes: patientNotes.trim() || null,
          privateNotes: privateNotes.trim() || null,
          followUpRecommended,
          followUpDate: followUpRecommended ? (followUpDate || null) : null,
          followUpReason: followUpRecommended ? (followUpReason.trim() || null) : null,
        };

        const result = await saveEncounterDraftAction(payload);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.data) {
          setSavedSnapshot({
            chiefComplaint,
            diagnosis,
            performedTreatment,
            patientNotes,
            privateNotes,
            followUpRecommended,
            followUpDate: followUpRecommended ? followUpDate : "",
            followUpReason: followUpRecommended ? followUpReason : "",
          });
          setLastSavedAt(result.data.updated_at);
          setFieldErrors({});
          toast.success("Consultation notes auto-saved.");
        }
      });
    };

    const handleOpenCompleteDialog = () => {
      if (!validateForCompletion()) {
        toast.error("Clinical diagnosis and treatment summary are required before completing the consultation.");
        onValidationFail?.();
        return;
      }
      setIsBillingModalOpen(true);
    };

    // Imperative ref for parent EncounterWorkspace / EncounterHeader
    useImperativeHandle(ref, () => ({
      triggerComplete: handleOpenCompleteDialog,
      saveDraft: handleSaveDraft,
    }));

    const handleFinalizeConsultationAndBilling = async (billingData: {
      targetStatus: "draft" | "issued" | "partially_paid" | "paid";
      procedureName: string;
      unitPrice: number;
      discountAmount: number;
      paidAmount?: number;
      paymentMethod?: "cash" | "card" | "bank_transfer" | "other";
      notes?: string;
    }): Promise<boolean> => {
      setIsCompleting(true);

      try {
        // 1. Complete & Sign Encounter
        const payload = {
          encounterId: encounter.id,
          chiefComplaint: chiefComplaint.trim() || null,
          diagnosis: diagnosis.trim(),
          performedTreatment: performedTreatment.trim(),
          patientNotes: patientNotes.trim() || null,
          privateNotes: privateNotes.trim() || null,
          followUpRecommended,
          followUpDate: followUpRecommended ? (followUpDate || null) : null,
          followUpReason: followUpRecommended ? (followUpReason.trim() || null) : null,
        };

        const result = await completeEncounterAction(payload);

        if (result.error) {
          toast.error(result.error);
          setIsCompleting(false);
          return false;
        }

        // 2. Generate Instant Invoice
        const invRes = await createInstantEncounterInvoiceAction({
          patientId: encounter.patient_id,
          encounterId: encounter.id,
          appointmentId: encounter.appointment_id,
          procedureName: billingData.procedureName,
          unitPrice: billingData.unitPrice,
          quantity: 1,
          discountAmount: billingData.discountAmount,
          taxAmount: 0,
          status: billingData.targetStatus,
          paidAmount: billingData.paidAmount,
          paymentMethod: billingData.paymentMethod,
          notes: billingData.notes,
        });

        if (invRes.success) {
          if (billingData.targetStatus === "draft") {
            toast.success("Consultation completed & signed. Bill saved as Draft (#1 on Billing list).", {
              duration: 4500,
            });
          } else if (billingData.targetStatus === "paid") {
            toast.success(`Consultation completed. Invoice ${invRes.invoiceNumber} paid in full.`);
          } else if (billingData.targetStatus === "issued") {
            toast.success(`Consultation completed. Invoice ${invRes.invoiceNumber} issued as Outstanding.`);
          } else {
            toast.success(`Consultation completed. Invoice ${invRes.invoiceNumber} created with partial deposit.`);
          }
        } else {
          toast.error(invRes.error || "Consultation signed, but failed to save invoice.");
        }

        setSavedSnapshot({
          chiefComplaint,
          diagnosis,
          performedTreatment,
          patientNotes,
          privateNotes,
          followUpRecommended,
          followUpDate: followUpRecommended ? followUpDate : "",
          followUpReason: followUpRecommended ? followUpReason : "",
        });

        setIsBillingModalOpen(false);
        setIsCompleting(false);
        router.refresh();
        return true;
      } catch {
        toast.error("Failed to complete consultation.");
        setIsCompleting(false);
        return false;
      }
    };

    const billingContext: InstantBillingContext = {
      patientId: encounter.patient_id,
      patientName: patient?.full_name ?? "Patient",
      patientReference: patient?.patient_reference ?? `PT-${encounter.patient_id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      encounterId: encounter.id,
      appointmentId: encounter.appointment_id,
      practitionerName: appointment?.practitioner_name,
      procedureName: appointment?.service_name || performedTreatment || "Clinical Consultation & Treatment",
      defaultPrice: appointment?.service_price || 0,
    };

    const formattedSavedAt = lastSavedAt
      ? format(new Date(lastSavedAt), "h:mm a")
      : null;

    return (
      <div className="space-y-5">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs px-5 py-3.5 shadow-xs">
          {/* Left: Auto-save status */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            {isCompleting ? (
              <>
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-foreground">Signing & finalizing consultation...</span>
              </>
            ) : isPendingSave ? (
              <>
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-foreground">Saving clinical notes...</span>
              </>
            ) : isDirty ? (
              <>
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-800 dark:text-amber-300">Unsaved changes in draft</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-800 dark:text-emerald-300">
                  {formattedSavedAt ? `Auto-Saved at ${formattedSavedAt}` : "All notes up to date"}
                </span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!isDirty || isBusy}
              size="sm"
              className="h-9 px-4 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/40 cursor-pointer"
            >
              {isPendingSave ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : null}
              Save Draft
            </Button>

            <Button
              type="button"
              onClick={handleOpenCompleteDialog}
              disabled={isBusy}
              size="sm"
              className="h-9 px-5 rounded-xl text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs gap-1.5 cursor-pointer"
            >
              {isCompleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5 stroke-[2.5]" />
              )}
              Complete Consultation
            </Button>
          </div>
        </div>

        {/* Follow-up Appointment Modal (if triggered) */}
        {followUpScheduling && patient && (
          <FollowUpAppointmentDialog
            open={isFollowUpDialogOpen}
            onOpenChange={setIsFollowUpDialogOpen}
            encounterId={encounter.id}
            patient={patient}
            scheduling={followUpScheduling}
            initialDate={followUpDate}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6 Sequenced Documentation Cards (UK Standard)                */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Card 1: Patient Concerns & Symptoms */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <MessageSquare className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      1. Patient Concerns &amp; Symptoms
                    </h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                      Required
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {chiefComplaint.length} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reason for visit, presenting symptoms, location, pain history, or aesthetic goals.
                </p>
              </div>
            </div>

            <Textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Patient presents with sensitivity in lower right quadrant for 2 days, exacerbated by cold liquids..."
              maxLength={1000}
              className="min-h-[90px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.chiefComplaint && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.chiefComplaint}</p>
            )}
          </div>

          {/* Card 2: Clinical Findings & Diagnosis (Dx) */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <ClipboardList className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      2. Clinical Findings &amp; Diagnosis (Dx)
                    </h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                      Required
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {diagnosis.length} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Intraoral/extraoral examination findings, vitality tests, radiographic findings, and diagnosis.
                </p>
              </div>
            </div>

            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Deep occlusal caries on LL6 (tooth 36) extending close to pulp. Reversible pulpitis diagnosed..."
              maxLength={1000}
              className="min-h-[90px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.diagnosis && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.diagnosis}</p>
            )}
          </div>

          {/* Card 3: Treatment Provided (Tx) */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <Stethoscope className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      3. Treatment Provided (Tx)
                    </h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                      Required
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {performedTreatment.length} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Procedures undertaken, tooth notation, local anaesthetic administered, restorative materials &amp; shades.
                </p>
              </div>
            </div>

            <Textarea
              value={performedTreatment}
              onChange={(e) => setPerformedTreatment(e.target.value)}
              placeholder="e.g. Infiltration 2.2ml Lignospan Special (2% lidocaine 1:80k adrenaline). Caries excavated LL6 MO. Cavity lined with TheraCal LC, restored with Filtek Supreme A2 composite..."
              maxLength={1000}
              className="min-h-[90px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.performedTreatment && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.performedTreatment}</p>
            )}
          </div>

          {/* Card 4: Post-Operative Advice & Patient Instructions (POA) */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <Info className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      4. Post-Operative Advice &amp; Instructions (POA)
                    </h3>
                    <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40 px-2.5 py-0.5 text-[10px] font-bold">
                      Patient Portal Visible
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {patientNotes.length} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Guidance, precautions, pain management advice, and home oral hygiene instructions shared with patient.
                </p>
              </div>
            </div>

            <Textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="e.g. Numbness will last ~2-3 hours; avoid hot drinks or chewing on treated side until anaesthetic wears off. Analgesia as required (Paracetamol / Ibuprofen)..."
              maxLength={1000}
              className="min-h-[85px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.patientNotes && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.patientNotes}</p>
            )}
          </div>

          {/* Card 5: Private Clinician Notes */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <Lock className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      5. Private Clinician Notes
                    </h3>
                    <span className="rounded-full bg-muted text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-bold">
                      Internal Practice Only
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {privateNotes.length} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Internal observations, communication details, risk assessment, and medico-legal remarks.
                </p>
              </div>
            </div>

            <Textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="e.g. Occlusion checked with 40µm articulating paper and adjusted. Patient consented after risks of post-op sensitivity discussed..."
              maxLength={1000}
              className="min-h-[85px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.privateNotes && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.privateNotes}</p>
            )}
          </div>

          {/* Card 6: Follow-up & Recall Planning */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                  <CalendarDays className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-extrabold text-foreground">
                    6. Follow-up &amp; Recall Planning
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule clinical review, suture removal, or routine dental recall interval.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Label htmlFor="follow-up-switch" className="text-xs font-bold text-foreground cursor-pointer">
                  Recommend follow-up
                </Label>
                <Switch
                  id="follow-up-switch"
                  checked={followUpRecommended}
                  onCheckedChange={setFollowUpRecommended}
                  className="data-[state=checked]:bg-[#0B3B36]"
                />
              </div>
            </div>

            {/* Follow-up Fields when Enabled */}
            {followUpRecommended && (
              <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                {/* Field 1: Recommended interval */}
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recall Interval
                  </Label>
                  <Select value={followUpInterval} onValueChange={(val) => val && handleIntervalChange(val)}>
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-card border-border/80 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week" className="text-xs font-medium">1 week (Review / Sutures)</SelectItem>
                      <SelectItem value="2-weeks" className="text-xs font-medium">2 weeks (Healing check)</SelectItem>
                      <SelectItem value="3-weeks" className="text-xs font-medium">3 weeks</SelectItem>
                      <SelectItem value="1-month" className="text-xs font-medium">1 month (Post-op evaluation)</SelectItem>
                      <SelectItem value="3-months" className="text-xs font-medium">3 months (Periodontal maintenance)</SelectItem>
                      <SelectItem value="6-months" className="text-xs font-medium">6 months (Routine Recall)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Field 2: Reason */}
                <div className="sm:col-span-4 space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Clinical Objective
                  </Label>
                  <Input
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="Review healing and symptoms"
                    className="h-10 rounded-xl text-xs bg-card border-border/80 font-medium"
                  />
                </div>

                {/* Field 3: Reminder */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Reminder
                  </Label>
                  <Select value={reminderChannel} onValueChange={(val) => val && setReminderChannel(val)}>
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-card border-border/80 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms-email" className="text-xs font-medium">SMS &amp; Email</SelectItem>
                      <SelectItem value="sms" className="text-xs font-medium">SMS only</SelectItem>
                      <SelectItem value="email" className="text-xs font-medium">Email only</SelectItem>
                      <SelectItem value="none" className="text-xs font-medium">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action: Add to Appointments */}
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFollowUpDialogOpen(true)}
                    className="h-10 w-full gap-1.5 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/40"
                  >
                    <Plus className="size-3.5" />
                    Add to Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Instant Billing & Invoicing Pop-up ── */}
        <InstantBillingDialog
          open={isBillingModalOpen}
          onOpenChange={(isOpen) => {
            setIsBillingModalOpen(isOpen);
            if (!isOpen) {
              router.refresh();
            }
          }}
          context={billingContext}
          onFinalize={handleFinalizeConsultationAndBilling}
          onCompleted={() => {
            router.refresh();
          }}
        />
      </div>
    );
  },
);
