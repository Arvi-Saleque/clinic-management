"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  completeEncounterAction,
  saveEncounterDraftAction,
} from "@/lib/server/encounters";
import { createInstantEncounterInvoiceAction } from "@/lib/server/invoices";
import { createStaffAppointment, getAvailableSlots } from "@/lib/server/appointments";
import { cn } from "@/lib/utils";
import type { SlotResult } from "@/types/availability";
import type {
  ClinicalEncounter,
  EncounterFollowUpSchedulingContext,
  EncounterWorkspaceAppointment,
  EncounterWorkspacePatient,
} from "@/types/clinical";
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
  followUpAppointments?: EncounterWorkspaceAppointment[];
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

interface CalculatedSlot {
  start: string; // "09:30"
  end: string;   // "10:15"
  display: string; // "09:30 AM - 10:15 AM"
  isoStart: string;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return "";
  try {
    const [hours, minutes] = startTime.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "";
    const totalMinutes = hours * 60 + minutes + (durationMinutes || 30);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const period = endH >= 12 ? "PM" : "AM";
    const displayH = endH % 12 === 0 ? 12 : endH % 12;
    return `${displayH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")} ${period}`;
  } catch {
    return "";
  }
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  try {
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  } catch {
    return timeStr;
  }
}

function computeSlotsForDuration(
  rawSlots: SlotResult[],
  durationMinutes: number,
  stepMinutes: number = 15,
): CalculatedSlot[] {
  if (!rawSlots || rawSlots.length === 0 || durationMinutes <= 0) return [];

  // Convert raw slots into intervals in minutes from midnight
  const freeIntervals: { start: number; end: number; datePrefix: string }[] = rawSlots.map((s) => {
    const dStart = new Date(s.slot_start);
    const dEnd = new Date(s.slot_end);
    const startMin = dStart.getHours() * 60 + dStart.getMinutes();
    const endMin = dEnd.getHours() * 60 + dEnd.getMinutes();
    const datePrefix = s.slot_start.split("T")[0];
    return { start: startMin, end: endMin, datePrefix };
  });

  // Merge contiguous / overlapping free intervals
  freeIntervals.sort((a, b) => a.start - b.start);
  const mergedBlocks: { start: number; end: number; datePrefix: string }[] = [];
  for (const interval of freeIntervals) {
    if (mergedBlocks.length === 0) {
      mergedBlocks.push({ ...interval });
    } else {
      const prev = mergedBlocks[mergedBlocks.length - 1];
      if (interval.start <= prev.end) {
        prev.end = Math.max(prev.end, interval.end);
      } else {
        mergedBlocks.push({ ...interval });
      }
    }
  }

  // Generate valid slot intervals matching durationMinutes
  const step = Math.min(stepMinutes, durationMinutes);
  const result: CalculatedSlot[] = [];

  for (const block of mergedBlocks) {
    for (let cur = block.start; cur + durationMinutes <= block.end; cur += step) {
      const startH = Math.floor(cur / 60);
      const startM = cur % 60;
      const endTotal = cur + durationMinutes;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;

      const startTime24 = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
      const endTime24 = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

      const isoStart = `${block.datePrefix}T${startTime24}:00`;
      const display = `${formatTime12h(startTime24)} - ${formatTime12h(endTime24)}`;

      result.push({
        start: startTime24,
        end: endTime24,
        display,
        isoStart,
      });
    }
  }

  return result;
}

export const EncounterDraftForm = forwardRef<EncounterDraftFormRef, EncounterDraftFormProps>(
  function EncounterDraftForm(
    {
      encounter,
      privateNotes: initialPrivateNotes,
      patient,
      appointment,
      followUpScheduling,
      followUpAppointments = [],
      onDirtyChange,
      onValidationFail,
    },
    ref,
  ) {
    const router = useRouter();
    const [isPendingSave, startSaveTransition] = useTransition();
    const [isCompleting, setIsCompleting] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    // Follow-up appointment name & scheduling state
    const currentProcedureName = appointment?.service_name || "Dental Treatment";
    const followUpProcedureName = `${currentProcedureName} - Follow-up`;

    const [scheduledFollowUps, setScheduledFollowUps] = useState<EncounterWorkspaceAppointment[]>(
      followUpAppointments ?? [],
    );
    const [followUpServiceId, setFollowUpServiceId] = useState<string>(
      followUpScheduling?.services[0]?.id ?? "",
    );
    const [followUpDuration, setFollowUpDuration] = useState<number>(
      followUpScheduling?.services[0]?.duration_minutes || 30,
    );
    const [followUpTime, setFollowUpTime] = useState("10:30");
    const [followUpFee, setFollowUpFee] = useState<string>("0");
    const [isBookingFollowUp, setIsBookingFollowUp] = useState(false);

    // 7-day strip offset
    const today = useMemo(() => startOfDay(new Date()), []);
    const maxBookingDate = useMemo(() => addDays(today, 60), [today]);
    const [stripOffset, setStripOffset] = useState(14); // 2 weeks out default

    // Raw available doctor slots from weekly setup
    const [rawSlots, setRawSlots] = useState<SlotResult[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Initial form snapshot
    const initialSnapshot: DraftSnapshot = {
      chiefComplaint: encounter.chief_complaint ?? "",
      diagnosis: encounter.diagnosis ?? "",
      performedTreatment: encounter.performed_treatment ?? "",
      patientNotes: encounter.patient_notes ?? "",
      privateNotes: initialPrivateNotes ?? "",
      followUpRecommended: encounter.follow_up_recommended ?? false,
      followUpDate: encounter.follow_up_date ?? format(addWeeks(new Date(), 2), "yyyy-MM-dd"),
      followUpReason: encounter.follow_up_reason ?? followUpProcedureName,
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

    const [lastSavedAt, setLastSavedAt] = useState<string>(encounter.updated_at);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Keep service ID synced
    useEffect(() => {
      if (!followUpServiceId && followUpScheduling?.services && followUpScheduling.services.length > 0) {
        setFollowUpServiceId(followUpScheduling.services[0].id);
      }
    }, [followUpScheduling, followUpServiceId]);

    // 7-day strip calculation
    const visible7Days = useMemo(() => {
      return Array.from({ length: 7 }, (_, i) => addDays(today, stripOffset + i));
    }, [stripOffset, today]);

    const handleStripPrevious = () => {
      setStripOffset((prev) => Math.max(0, prev - 7));
    };

    const handleStripNext = () => {
      setStripOffset((prev) => Math.min(53, prev + 7));
    };

    const handleSelectDate = (d: Date) => {
      const dateStr = format(d, "yyyy-MM-dd");
      setFollowUpDate(dateStr);
    };

    // Selected date object
    const selectedDateObj = useMemo(() => {
      try {
        return followUpDate ? new Date(`${followUpDate}T00:00:00`) : addWeeks(today, 2);
      } catch {
        return addWeeks(today, 2);
      }
    }, [followUpDate, today]);

    // Fetch doctor's weekly available periods for the chosen date
    useEffect(() => {
      if (!followUpRecommended || !followUpDate || !followUpScheduling?.practitioner_id || !followUpServiceId) {
        setRawSlots([]);
        return;
      }

      setLoadingSlots(true);
      getAvailableSlots(followUpScheduling.practitioner_id, followUpServiceId, followUpDate)
        .then(({ slots }) => {
          setRawSlots(slots || []);
        })
        .catch(() => {
          setRawSlots([]);
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    }, [followUpRecommended, followUpDate, followUpServiceId, followUpScheduling?.practitioner_id]);

    // Compute slots dynamically based on the doctor's specified duration
    const availableSlotsForDuration = useMemo(() => {
      return computeSlotsForDuration(rawSlots, followUpDuration, 15);
    }, [rawSlots, followUpDuration]);

    // Handle slot selection from available doctor periods
    const handleSelectSlot = (slot: CalculatedSlot) => {
      setFollowUpTime(slot.start);
    };

    // Automatically calculated end time
    const calculatedEndTime = useMemo(() => {
      return calculateEndTime(followUpTime, followUpDuration);
    }, [followUpTime, followUpDuration]);

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
            toast.success("Consultation completed and invoice saved as Draft.");
          } else {
            toast.success("Consultation completed and invoice issued successfully.");
          }
          return true;
        } else {
          toast.success("Consultation completed (invoice creation encountered an issue).");
          return true;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to finalize consultation.";
        toast.error(message);
        setIsCompleting(false);
        return false;
      }
    };

    // Handler to book follow-up appointment in-place
    const handleScheduleFollowUp = async () => {
      if (!patient?.id || !followUpScheduling?.practitioner_id || !followUpScheduling?.branch_id || !followUpServiceId) {
        toast.error("Missing patient, practitioner, or service details to schedule follow-up.");
        return;
      }

      if (!followUpDate || !followUpTime) {
        toast.error("Please specify both a valid follow-up date and time.");
        return;
      }

      setIsBookingFollowUp(true);

      try {
        const startsAt = `${followUpDate}T${followUpTime}:00`;
        const feeAmount = parseFloat(followUpFee) || 0;

        const result = await createStaffAppointment({
          practitionerId: followUpScheduling.practitioner_id,
          serviceId: followUpServiceId,
          branchId: followUpScheduling.branch_id,
          patientId: patient.id,
          startsAt,
          durationMinutes: followUpDuration,
          bookingSource: "staff",
          notes: `[FEE:${feeAmount.toFixed(2)}] [DUR:${followUpDuration}] Follow-up for ${currentProcedureName} • Fee: €${feeAmount.toFixed(2)}`,
          originatingEncounterId: encounter.id,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        const newApt: EncounterWorkspaceAppointment = {
          id: result.id || Math.random().toString(),
          starts_at: startsAt,
          ends_at: startsAt,
          status: "confirmed",
          booking_source: "staff",
          service_name: followUpProcedureName,
          service_duration: followUpDuration,
          service_price: feeAmount,
          practitioner_name: followUpScheduling.practitioner_name || "Doctor",
          branch_name: followUpScheduling.branch_name || "Main Clinic Branch",
          notes: `[FEE:${feeAmount.toFixed(2)}] [DUR:${followUpDuration}] Follow-up for ${currentProcedureName} • Fee: €${feeAmount.toFixed(2)}`,
        };

        setScheduledFollowUps((prev) => [...prev, newApt]);
        toast.success(
          `Follow-up appointment scheduled for ${format(new Date(startsAt), "EEE, d MMM yyyy 'at' h:mm a")}!`
        );
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to schedule appointment.";
        toast.error(message);
      } finally {
        setIsBookingFollowUp(false);
      }
    };

    // Context for Instant Billing Dialog
    const billingContext: InstantBillingContext = {
      patientId: encounter.patient_id,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Patient",
      patientReference: patient ? `PT-${patient.id.slice(0, 8).toUpperCase()}` : "PT-RECORD",
      encounterId: encounter.id,
      appointmentId: encounter.appointment_id,
      practitionerName: followUpScheduling?.practitioner_name,
      procedureName: performedTreatment || appointment?.service_name || "Clinical Consultation",
      defaultPrice: appointment?.service_price || 0,
    };

    return (
      <div className="space-y-6">
        {/* Top Floating / Sticky Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDirty ? (
              <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5" /> Unsaved changes in clinical draft
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-3.5" /> All clinical notes saved &bull; Last: {format(new Date(lastSavedAt), "h:mm a")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isBusy || !isDirty}
              className="h-9 gap-1.5 rounded-xl border-border text-xs font-bold shadow-2xs hover:bg-muted/40 cursor-pointer"
            >
              {isPendingSave ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              Save Draft
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenCompleteDialog}
              disabled={isBusy}
              className="h-9 gap-1.5 rounded-xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white font-bold text-xs shadow-md shadow-[#0B3B36]/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isCompleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
              )}
              Complete Consultation
            </Button>
          </div>
        </div>

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
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                      Subjective
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/80 hidden sm:inline">
                    Chief complaint &amp; dental history
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record what the patient reports: pain intensity, duration, triggers, or aesthetic goals.
                </p>
              </div>
            </div>

            <Textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Patient presents with sensitivity on upper right molar when drinking cold water. Mild intermittent discomfort for 4 days."
              className="min-h-[85px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.chiefComplaint && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.chiefComplaint}</p>
            )}
          </div>

          {/* Card 2: Clinical Diagnosis */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <Stethoscope className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      2. Clinical Diagnosis
                    </h3>
                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      Required *
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/80 hidden sm:inline">
                    Assessment &amp; Findings
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chairside diagnosis, caries status, periodontal classification, or vitality testing results.
                </p>
              </div>
            </div>

            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Mesio-occlusal dentinal caries on tooth 16 (#3). Cold pulp test positive, periapical tissues non-tender."
              className="min-h-[90px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5 font-medium"
            />
            {fieldErrors.diagnosis && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.diagnosis}</p>
            )}
          </div>

          {/* Card 3: Treatment Performed & Materials */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <ClipboardList className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      3. Treatment Performed &amp; Materials
                    </h3>
                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      Required *
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/80 hidden sm:inline">
                    Operative Summary
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Procedures completed, local anaesthetic administered, restorative materials and bonding protocols.
                </p>
              </div>
            </div>

            <Textarea
              value={performedTreatment}
              onChange={(e) => setPerformedTreatment(e.target.value)}
              placeholder="e.g. Administered 1.8mL 2% Lidocaine with 1:100k epi (buccal infiltration). Caries excavated, 37% phosphoric acid etch, universal bonding agent applied, light-cured composite resin layered (A2 shade). Occlusion checked and adjusted."
              className="min-h-[105px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5 font-medium"
            />
            {fieldErrors.performedTreatment && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.performedTreatment}</p>
            )}
          </div>

          {/* Card 4: Post-Op Care & Patient Instructions */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <Info className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      4. Post-Op Care &amp; Patient Instructions
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                      Patient Facing
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/80 hidden sm:inline">
                    Home Care Guidance
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Guidance shared with the patient and visible in their portal summary.
                </p>
              </div>
            </div>

            <Textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="e.g. Avoid hot liquids and chewing hard foods until numbness completely subsides. Mild sensitivity to cold is expected for 48-72 hours. Contact the clinic if sensitivity persists."
              className="min-h-[85px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.patientNotes && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.patientNotes}</p>
            )}
          </div>

          {/* Card 5: Confidential Clinician Notes */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 border border-border shadow-2xs">
                <Lock className="size-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-extrabold text-foreground">
                      5. Confidential Clinician Notes
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      Staff Only
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/80 hidden sm:inline">
                    Internal Clinical Audit
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Private doctor observations, compliance notes, or legal audit remarks. Never shown to patient.
                </p>
              </div>
            </div>

            <Textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="e.g. Deep cavity close to pulp chamber. Advised patient that endodontic therapy may be required in future if symptoms develop."
              className="min-h-[85px] rounded-2xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y p-3.5"
            />
            {fieldErrors.privateNotes && (
              <p className="text-[11px] font-bold text-destructive">{fieldErrors.privateNotes}</p>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Card 6: Follow-up & Next Appointment Scheduling               */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                  <CalendarDays className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-extrabold text-foreground">
                    6. Follow-up &amp; Next Appointment
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule the patient&apos;s follow-up visit with the same doctor.
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

            {/* Follow-up Appointment Form & Confirmed List */}
            {followUpRecommended && (
              <div className="pt-4 border-t border-border/50 space-y-5">
                {/* Existing Scheduled Follow-ups List */}
                {scheduledFollowUps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" /> Confirmed Follow-up Appointments ({scheduledFollowUps.length})
                    </p>
                    <div className="grid gap-2">
                      {scheduledFollowUps.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3.5 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                              <Calendar className="size-4" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {apt.service_name} &bull;{" "}
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  {format(new Date(apt.starts_at), "EEE, d MMM yyyy 'at' h:mm a")}
                                </span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {apt.service_duration} mins &bull; Dr. {apt.practitioner_name}{" "}
                                &bull; <span className="font-bold text-foreground font-mono">€{(Number(apt.service_price) || 0).toFixed(2)}</span>
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20">
                            Confirmed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In-place Appointment Scheduler Card */}
                <div className="rounded-3xl border border-border/80 bg-muted/20 p-5 sm:p-6 space-y-5">
                  {/* Row 1: Procedure Name (Same + " - Follow-up") & Doctor (Same Doctor) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Procedure Name */}
                    <div className="sm:col-span-7 space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Follow-up Procedure
                      </Label>
                      <div className="relative">
                        <Input
                          value={followUpProcedureName}
                          readOnly
                          className="h-10.5 rounded-xl text-xs bg-card font-bold border-border/80 text-foreground cursor-default pr-20"
                        />
                        <span className="absolute right-2.5 top-2.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Follow-up
                        </span>
                      </div>
                    </div>

                    {/* Doctor (Same Doctor) */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Attending Doctor
                      </Label>
                      <div className="h-10.5 rounded-xl bg-card border border-border/80 px-3.5 flex items-center gap-2 text-xs font-bold text-foreground">
                        <Stethoscope className="size-4 text-primary shrink-0" />
                        <span className="truncate">Dr. {followUpScheduling?.practitioner_name || "Doctor"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* Row 2: 7-Day Date Carousel Strip                          */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-3 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Appointment Date
                        </Label>
                        <p className="text-xs font-extrabold text-foreground mt-0.5">
                          {format(selectedDateObj, "MMMM yyyy")}
                        </p>
                      </div>

                      {/* Exact Date Picker Input */}
                      <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={format(today, "yyyy-MM-dd")}
                        className="h-8.5 rounded-xl text-xs bg-card border-border/80 font-mono font-bold w-36"
                      />
                    </div>

                    {/* 7-Day Interactive Strip */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={stripOffset === 0}
                        onClick={handleStripPrevious}
                        aria-label="Previous 7 days"
                        className="size-10 shrink-0 rounded-xl border-border/80 bg-card hover:bg-muted transition-all disabled:opacity-25 shadow-2xs cursor-pointer"
                      >
                        <ChevronLeft className="size-4 text-foreground" />
                      </Button>

                      <div className="grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
                        {visible7Days.map((dayItem) => {
                          const isSelected = isSameDay(dayItem, selectedDateObj);
                          const isCurrentDay = isToday(dayItem);
                          const isPast = isBefore(dayItem, today);
                          const isBeyondMax = isAfter(dayItem, maxBookingDate);
                          const disabled = isPast || isBeyondMax;

                          const weekdayShort = format(dayItem, "EEE");
                          const dayNum = format(dayItem, "d");

                          return (
                            <button
                              key={dayItem.toISOString()}
                              type="button"
                              disabled={disabled}
                              onClick={() => handleSelectDate(dayItem)}
                              className={cn(
                                "group relative flex flex-col items-center justify-center rounded-2xl py-2.5 px-1 transition-all duration-200 cursor-pointer",
                                isSelected
                                  ? "bg-[#0B3B36] text-white font-bold shadow-md shadow-[#0B3B36]/25 scale-[1.03] ring-2 ring-emerald-500/40"
                                  : "bg-card hover:bg-muted border border-border/80 text-foreground hover:border-emerald-500/30",
                                disabled && "opacity-25 pointer-events-none cursor-not-allowed",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px] font-semibold tracking-wide",
                                  isSelected ? "text-white/80" : "text-muted-foreground",
                                )}
                              >
                                {weekdayShort}
                              </span>

                              <span
                                className={cn(
                                  "font-heading text-base sm:text-lg font-extrabold leading-tight my-0.5 font-mono",
                                  isSelected ? "text-white" : "text-foreground",
                                )}
                              >
                                {dayNum}
                              </span>

                              <div
                                className={cn(
                                  "mt-0.5 h-1 w-4 rounded-full transition-all",
                                  isSelected
                                    ? "bg-emerald-400"
                                    : isCurrentDay
                                      ? "bg-amber-500"
                                      : "bg-transparent",
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={stripOffset >= 53}
                        onClick={handleStripNext}
                        aria-label="Next 7 days"
                        className="size-10 shrink-0 rounded-xl border-border/80 bg-card hover:bg-muted transition-all disabled:opacity-25 shadow-2xs cursor-pointer"
                      >
                        <ChevronRight className="size-4 text-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* Row 3: Duration Specification & Service Fee               */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1 border-t border-border/60 items-end">
                    {/* Duration Input & Quick Buttons */}
                    <div className="sm:col-span-7 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Visit Duration (Minutes)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Slots recalculate automatically
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={5}
                          max={360}
                          step={5}
                          value={followUpDuration || ""}
                          onChange={(e) => setFollowUpDuration(parseInt(e.target.value, 10) || 0)}
                          placeholder="30"
                          className="h-10 w-24 rounded-xl text-xs bg-card border-border/80 font-mono font-black"
                        />
                        <div className="flex flex-1 gap-1">
                          {[15, 30, 45, 60].map((dur) => (
                            <button
                              type="button"
                              key={dur}
                              onClick={() => setFollowUpDuration(dur)}
                              className={cn(
                                "flex-1 h-10 rounded-xl text-xs font-mono font-bold border transition cursor-pointer",
                                followUpDuration === dur
                                  ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-2xs"
                                  : "bg-card hover:bg-muted text-muted-foreground border-border/80",
                              )}
                            >
                              {dur}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Service Fee (€) */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Service Fee (€)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                          €
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          value={followUpFee}
                          onChange={(e) => setFollowUpFee(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0.00"
                          className="h-10 rounded-xl pl-7 text-xs bg-card border-border/80 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* Row 4: Available Slots (Computed from Duration)           */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-3 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="size-3 text-primary" />
                        Available {followUpDuration}m Slots on {format(selectedDateObj, "EEE, MMM d")}
                      </Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {availableSlotsForDuration.length} slots available
                      </span>
                    </div>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span>Calculating doctor schedule for {followUpDuration}m duration...</span>
                      </div>
                    ) : availableSlotsForDuration.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground bg-card/50">
                        {rawSlots.length === 0
                          ? "Doctor is not working on this day. You can adjust duration or enter a start time manually below."
                          : `No open schedule window can accommodate a continuous ${followUpDuration}-minute visit on this date.`}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {availableSlotsForDuration.map((slot) => {
                          const isSlotSelected = followUpTime === slot.start;

                          return (
                            <button
                              type="button"
                              key={slot.isoStart}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer",
                                isSlotSelected
                                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                                  : "bg-card text-foreground border-border/80 hover:bg-muted hover:border-emerald-500/40",
                              )}
                            >
                              {slot.display}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* Row 5: Start Time Adjustment & Auto Schedule Window       */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1 border-t border-border/60 items-center">
                    {/* Start Time Input */}
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Start Time (Selected / Adjusted)
                      </Label>
                      <Input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        className="h-10 rounded-xl text-xs bg-card border-border/80 font-mono font-black"
                      />
                    </div>

                    {/* Automatic Schedule Window Live Box */}
                    <div className="sm:col-span-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider font-sans">
                          Schedule Window:
                        </span>
                        <span className="font-bold text-foreground">{formatTime12h(followUpTime)}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">
                          {calculatedEndTime}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-sans font-medium">
                          ({followUpDuration} mins)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-sans text-xs">
                        <span className="text-muted-foreground font-bold">Fee:</span>
                        <span className="font-heading font-black text-foreground text-sm">
                          €{(parseFloat(followUpFee) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Confirm & Save Follow-up Appointment */}
                  <div className="pt-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Saves directly as <strong className="text-foreground">Confirmed</strong> with Dr. {followUpScheduling?.practitioner_name || "Doctor"}.
                    </p>

                    <Button
                      type="button"
                      onClick={handleScheduleFollowUp}
                      disabled={isBookingFollowUp}
                      className="gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white font-bold text-xs shadow-md shadow-[#0B3B36]/20 h-10.5 px-5 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      {isBookingFollowUp ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Scheduling Appointment...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-4 stroke-[2.5]" />
                          <span>Save &amp; Schedule Follow-up Appointment</span>
                        </>
                      )}
                    </Button>
                  </div>
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
