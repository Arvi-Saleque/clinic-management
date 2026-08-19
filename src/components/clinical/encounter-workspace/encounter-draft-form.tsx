"use client";

import { useEffect, useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type {
  ClinicalEncounter,
  EncounterFollowUpSchedulingContext,
  EncounterWorkspaceAppointment,
  EncounterWorkspacePatient,
} from "@/types/clinical";
import { FollowUpAppointmentDialog } from "./follow-up-appointment-dialog";

interface EncounterDraftFormProps {
  encounter: ClinicalEncounter;
  privateNotes: string | null;
  patient?: EncounterWorkspacePatient;
  appointment?: EncounterWorkspaceAppointment | null;
  followUpScheduling?: EncounterFollowUpSchedulingContext | null;
  onDirtyChange?: (isDirty: boolean) => void;
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

export function EncounterDraftForm({
  encounter,
  privateNotes: initialPrivateNotes,
  patient,
  followUpScheduling,
  onDirtyChange,
}: EncounterDraftFormProps) {
  const router = useRouter();
  const [isPendingSave, startSaveTransition] = useTransition();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);

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
        toast.success("Consultation draft saved.");
      }
    });
  };

  const handleOpenCompleteDialog = () => {
    if (!validateForCompletion()) {
      toast.error("Please fill in the required diagnosis and treatment summary before finalizing.");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    setIsCompleting(true);

    try {
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
        setIsConfirmDialogOpen(false);
        setIsCompleting(false);
        toast.success("Consultation completed successfully.");
        router.refresh();
      }
    } catch {
      toast.error("Failed to complete consultation.");
      setIsCompleting(false);
    }
  };

  const formattedSavedAt = lastSavedAt
    ? format(new Date(lastSavedAt), "h:mm a")
    : null;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-5 py-3 shadow-2xs">
        {/* Left: Auto-save status */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {isCompleting ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Finalizing consultation...</span>
            </>
          ) : isPendingSave ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Saving draft...</span>
            </>
          ) : isDirty ? (
            <>
              <AlertCircle className="size-3.5 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">
                {formattedSavedAt ? `Saved ${formattedSavedAt}` : "All changes saved"}
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
            className="h-9 px-4 rounded-xl text-xs font-semibold border-border/80 hover:bg-muted/40"
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
            className="h-9 px-5 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs gap-1.5"
          >
            {isCompleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Complete Consultation
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Completing Encounter */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Complete Consultation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Completing this consultation will finalize the clinical record. Are you sure you want to finish?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-border/50 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              className="h-9 px-4 text-xs font-semibold rounded-xl"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              onClick={handleConfirmComplete}
              disabled={isCompleting}
              className="h-9 px-5 text-xs font-bold rounded-xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5"
            >
              {isCompleting && <Loader2 className="size-3.5 animate-spin" />}
              Confirm &amp; Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      {/* 6 Sequenced Documentation Cards                               */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        {/* Card 1: Chief Complaint */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <MessageSquare className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    1. Chief Complaint
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold">
                    Required
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {chiefComplaint.length} / 1000
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                What brings the patient in today?
              </p>
            </div>
          </div>

          <Textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="e.g. Pain in lower right molar since 2 days..."
            maxLength={1000}
            className="min-h-[85px] rounded-xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y"
          />
          {fieldErrors.chiefComplaint && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.chiefComplaint}</p>
          )}
        </div>

        {/* Card 2: Clinical Diagnosis */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <ClipboardList className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    2. Clinical Diagnosis
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold">
                    Required
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {diagnosis.length} / 1000
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your clinical assessment and diagnosis.
              </p>
            </div>
          </div>

          <Textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Irreversible pulpitis with apical periodontitis..."
            maxLength={1000}
            className="min-h-[85px] rounded-xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y"
          />
          {fieldErrors.diagnosis && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.diagnosis}</p>
          )}
        </div>

        {/* Card 3: Performed Treatment & Procedures */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <Stethoscope className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    3. Performed Treatment &amp; Procedures
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold">
                    Required
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {performedTreatment.length} / 1000
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record procedures, materials and techniques used.
              </p>
            </div>
          </div>

          <Textarea
            value={performedTreatment}
            onChange={(e) => setPerformedTreatment(e.target.value)}
            placeholder="e.g. Root canal therapy on tooth 46 using rotary instrumentation..."
            maxLength={1000}
            className="min-h-[85px] rounded-xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y"
          />
          {fieldErrors.performedTreatment && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.performedTreatment}</p>
          )}
        </div>

        {/* Card 4: Patient Advice & Instructions */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <Info className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    4. Patient Advice &amp; Instructions
                  </h3>
                  <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40 px-2 py-0.5 text-[10px] font-semibold">
                    Patient visible
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {patientNotes.length} / 1000
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Post-operative guidance and care instructions.
              </p>
            </div>
          </div>

          <Textarea
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            placeholder="e.g. Avoid hard foods for 24 hours, take prescribed medication as advised..."
            maxLength={1000}
            className="min-h-[85px] rounded-xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y"
          />
          {fieldErrors.patientNotes && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.patientNotes}</p>
          )}
        </div>

        {/* Card 5: Private Clinician Notes */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <Lock className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    5. Private Clinician Notes
                  </h3>
                  <span className="rounded-full bg-muted text-muted-foreground border border-border/60 px-2 py-0.5 text-[10px] font-semibold">
                    Internal
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {privateNotes.length} / 1000
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notes visible only to clinical staff.
              </p>
            </div>
          </div>

          <Textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            placeholder="e.g. Monitor occlusion on next visit. Patient anxious about injection."
            maxLength={1000}
            className="min-h-[85px] rounded-xl border-border/80 bg-card text-xs leading-relaxed placeholder:text-muted-foreground/60 resize-y"
          />
          {fieldErrors.privateNotes && (
            <p className="text-[11px] font-semibold text-destructive">{fieldErrors.privateNotes}</p>
          )}
        </div>

        {/* Card 6: Follow-up Recommendation */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
                <CalendarDays className="size-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  6. Follow-up Recommendation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plan and set follow-up for the patient.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Label htmlFor="follow-up-switch" className="text-xs font-semibold text-foreground cursor-pointer">
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
            <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Field 1: Recommended after */}
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Recommended after
                </Label>
                <Select value={followUpInterval} onValueChange={(val) => val && handleIntervalChange(val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-week" className="text-xs">1 week</SelectItem>
                    <SelectItem value="2-weeks" className="text-xs">2 weeks</SelectItem>
                    <SelectItem value="3-weeks" className="text-xs">3 weeks</SelectItem>
                    <SelectItem value="1-month" className="text-xs">1 month</SelectItem>
                    <SelectItem value="3-months" className="text-xs">3 months</SelectItem>
                    <SelectItem value="6-months" className="text-xs">6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field 2: Reason */}
              <div className="sm:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Reason
                </Label>
                <Input
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  placeholder="Review healing and symptoms"
                  className="h-9 rounded-xl text-xs bg-card border-border/80"
                />
              </div>

              {/* Field 3: Reminder */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Reminder
                </Label>
                <Select value={reminderChannel} onValueChange={(val) => val && setReminderChannel(val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms-email" className="text-xs">SMS &amp; Email</SelectItem>
                    <SelectItem value="sms" className="text-xs">SMS only</SelectItem>
                    <SelectItem value="email" className="text-xs">Email only</SelectItem>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action: Add to Appointments */}
              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFollowUpDialogOpen(true)}
                  className="h-9 w-full gap-1 rounded-xl text-xs font-semibold border-border/80 hover:bg-muted/40"
                >
                  <Plus className="size-3" />
                  Add to Appointments
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
