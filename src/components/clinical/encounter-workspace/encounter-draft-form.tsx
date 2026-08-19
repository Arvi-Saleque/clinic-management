"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  FileCheck,
  FileHeart,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  completeEncounterAction,
  saveEncounterDraftAction,
} from "@/lib/server/encounters";
import type { ClinicalEncounter } from "@/types/clinical";

interface EncounterDraftFormProps {
  encounter: ClinicalEncounter;
  privateNotes: string | null;
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
  onDirtyChange,
}: EncounterDraftFormProps) {
  const router = useRouter();
  const [isPendingSave, startSaveTransition] = useTransition();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    chiefComplaint: true,
    diagnosis: false,
    treatment: false,
    patientNotes: false,
    privateNotes: false,
    followUp: false,
  });

  const setSectionOpen = (section: string, open: boolean) => {
    setOpenSections((current) => ({ ...current, [section]: open }));
  };

  // Initial form snapshot from server-loaded context
  const initialSnapshot: DraftSnapshot = {
    chiefComplaint: encounter.chief_complaint ?? "",
    diagnosis: encounter.diagnosis ?? "",
    performedTreatment: encounter.performed_treatment ?? "",
    patientNotes: encounter.patient_notes ?? "",
    privateNotes: initialPrivateNotes ?? "",
    followUpRecommended: encounter.follow_up_recommended ?? false,
    followUpDate: encounter.follow_up_date ?? "",
    followUpReason: encounter.follow_up_reason ?? "",
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

  // Compute dirty state against the last successfully saved snapshot
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

  // Protect against accidental window / tab exit when dirty
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

  // Notify parent workspace of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const validateDraft = (): boolean => {
    const errors: Record<string, string> = {};

    if (chiefComplaint.length > 1000) {
      errors.chiefComplaint = "Chief complaint must not exceed 1,000 characters.";
    }
    if (diagnosis.length > 1000) {
      errors.diagnosis = "Diagnosis must not exceed 1,000 characters.";
    }
    if (performedTreatment.length > 1000) {
      errors.performedTreatment = "Performed treatment must not exceed 1,000 characters.";
    }
    if (followUpReason.length > 500) {
      errors.followUpReason = "Follow-up reason must not exceed 500 characters.";
    }

    if (followUpRecommended) {
      if (!followUpDate || !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) {
        errors.followUpDate = "A valid follow-up date (YYYY-MM-DD) is required when follow-up is recommended.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForCompletion = (): boolean => {
    const errors: Record<string, string> = {};

    if (!diagnosis.trim()) {
      errors.diagnosis = "Clinical diagnosis is required before completing the consultation.";
    } else if (diagnosis.length > 1000) {
      errors.diagnosis = "Diagnosis must not exceed 1,000 characters.";
    }

    if (!performedTreatment.trim()) {
      errors.performedTreatment =
        "Performed treatment / examination summary is required before completing the consultation.";
    } else if (performedTreatment.length > 1000) {
      errors.performedTreatment = "Performed treatment must not exceed 1,000 characters.";
    }

    if (chiefComplaint.length > 1000) {
      errors.chiefComplaint = "Chief complaint must not exceed 1,000 characters.";
    }
    if (followUpReason.length > 500) {
      errors.followUpReason = "Follow-up reason must not exceed 500 characters.";
    }

    if (followUpRecommended) {
      if (!followUpDate || !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) {
        errors.followUpDate = "A valid follow-up date (YYYY-MM-DD) is required when follow-up is recommended.";
      }
    }

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
      toast.error("Please complete the required diagnosis and treatment summary before finalizing.");
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
        // Clear dirty state baseline so beforeunload does not trigger
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">Clinical Documentation</h2>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              {isCompleting ? (
                <>
                  <Loader2 className="size-3 animate-spin text-primary" />
                  Finalizing consultation...
                </>
              ) : isPendingSave ? (
                <>
                  <Loader2 className="size-3 animate-spin text-primary" />
                  Saving draft...
                </>
              ) : isDirty ? (
                <>
                  <AlertCircle className="size-3 text-amber-600" />
                  Unsaved changes
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  {formattedSavedAt ? `Saved at ${formattedSavedAt}` : "All changes saved"}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!isDirty || isBusy}
            size="sm"
            className="gap-1.5 rounded-xl"
          >
            {isPendingSave ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : !isDirty ? (
              <>
                <Check className="size-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleOpenCompleteDialog}
            disabled={isBusy}
            size="sm"
            className="gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isCompleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                Complete Consultation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)]">
        <details
          open={openSections.chiefComplaint || !!fieldErrors.chiefComplaint}
          onToggle={(event) => setSectionOpen("chiefComplaint", event.currentTarget.open)}
          className="group border-b border-border/60 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                <FileHeart className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Chief Complaint</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Presenting symptoms or primary dental concern</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">{chiefComplaint.length}/1000</span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </div>
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Textarea
              id="chief-complaint"
              value={chiefComplaint}
              disabled={isBusy}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Document the patient's presenting symptoms or primary dental concern..."
              rows={4}
              className="resize-y rounded-xl bg-background"
              aria-invalid={!!fieldErrors.chiefComplaint}
            />
            {fieldErrors.chiefComplaint && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.chiefComplaint}</p>}
          </div>
        </details>

        <details
          open={openSections.diagnosis || !!fieldErrors.diagnosis}
          onToggle={(event) => setSectionOpen("diagnosis", event.currentTarget.open)}
          className="group border-b border-border/60 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Clinical Diagnosis</p>
                  <Badge variant="outline" className="border-primary/15 bg-primary-soft/50 text-[10px] font-medium text-primary">Required</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Assessment, findings and relevant pathology</p>
              </div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Textarea
              id="diagnosis"
              value={diagnosis}
              disabled={isBusy}
              onChange={(e) => {
                setDiagnosis(e.target.value);
                if (fieldErrors.diagnosis) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.diagnosis;
                    return next;
                  });
                }
              }}
              placeholder="Enter diagnostic assessment, clinical findings, pathology..."
              rows={4}
              className="resize-y rounded-xl bg-background"
              aria-invalid={!!fieldErrors.diagnosis}
            />
            {fieldErrors.diagnosis && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.diagnosis}</p>}
          </div>
        </details>

        <details
          open={openSections.treatment || !!fieldErrors.performedTreatment}
          onToggle={(event) => setSectionOpen("treatment", event.currentTarget.open)}
          className="group border-b border-border/60 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                <FileCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Performed Treatment & Procedures</p>
                  <Badge variant="outline" className="border-primary/15 bg-primary-soft/50 text-[10px] font-medium text-primary">Required</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Procedures, tooth numbers, materials and techniques</p>
              </div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Textarea
              id="performed-treatment"
              value={performedTreatment}
              disabled={isBusy}
              onChange={(e) => {
                setPerformedTreatment(e.target.value);
                if (fieldErrors.performedTreatment) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.performedTreatment;
                    return next;
                  });
                }
              }}
              placeholder="Document procedures performed, tooth numbers treated, materials, anaesthesia and techniques used..."
              rows={4}
              className="resize-y rounded-xl bg-background"
              aria-invalid={!!fieldErrors.performedTreatment}
            />
            {fieldErrors.performedTreatment && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.performedTreatment}</p>}
          </div>
        </details>

        <details
          open={openSections.patientNotes}
          onToggle={(event) => setSectionOpen("patientNotes", event.currentTarget.open)}
          className="group border-b border-border/60 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                <MessageSquare className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Patient Advice & Instructions</p>
                  <Badge variant="outline" className="hidden border-emerald-500/20 bg-emerald-500/8 text-[10px] font-medium text-emerald-700 sm:inline-flex">
                    <Eye className="mr-1 size-3" /> Patient visible
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Post-operative guidance and care instructions</p>
              </div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Textarea
              id="patient-notes"
              value={patientNotes}
              disabled={isBusy}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="Post-operative care guidelines, home hygiene instructions, recommended OTC remedies..."
              rows={4}
              className="resize-y rounded-xl bg-background"
            />
          </div>
        </details>

        <details
          open={openSections.privateNotes}
          onToggle={(event) => setSectionOpen("privateNotes", event.currentTarget.open)}
          className="group border-b border-border/60 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Lock className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Private Clinician Notes</p>
                  <Badge variant="secondary" className="text-[10px] font-medium">Internal</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Internal notes not visible to the patient</p>
              </div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Textarea
              id="private-notes"
              value={privateNotes}
              disabled={isBusy}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Internal clinician reflections, differential diagnosis thoughts, staff observations..."
              rows={4}
              className="resize-y rounded-xl bg-background"
            />
          </div>
        </details>

        <details
          open={openSections.followUp || !!fieldErrors.followUpDate || !!fieldErrors.followUpReason}
          onToggle={(event) => setSectionOpen("followUp", event.currentTarget.open)}
          className="group last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                <CalendarClock className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Follow-up & Recall Recommendation</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {followUpRecommended ? "Follow-up recommended" : "No follow-up currently recommended"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="follow-up-switch"
                checked={followUpRecommended}
                disabled={isBusy}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={(checked) => {
                  setFollowUpRecommended(checked);
                  if (!checked) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.followUpDate;
                      return next;
                    });
                  } else {
                    setSectionOpen("followUp", true);
                  }
                }}
              />
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </div>
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            {followUpRecommended ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="follow-up-date" className="text-xs font-medium">Target Follow-up Date *</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={followUpDate}
                    disabled={isBusy}
                    onChange={(e) => {
                      setFollowUpDate(e.target.value);
                      if (fieldErrors.followUpDate) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.followUpDate;
                          return next;
                        });
                      }
                    }}
                    aria-invalid={!!fieldErrors.followUpDate}
                    className="rounded-xl bg-background"
                  />
                  {fieldErrors.followUpDate && <p className="text-xs text-destructive">{fieldErrors.followUpDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="follow-up-reason" className="text-xs font-medium">Reason / Clinical Objective</Label>
                  <Input
                    id="follow-up-reason"
                    value={followUpReason}
                    disabled={isBusy}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="e.g. crown cementation or 2-week review"
                    maxLength={500}
                    className="rounded-xl bg-background"
                  />
                  {fieldErrors.followUpReason && <p className="text-xs text-destructive">{fieldErrors.followUpReason}</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">Enable follow-up only when a recall or review visit is clinically recommended.</p>
            )}
          </div>
        </details>
      </div>

      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!isCompleting) setIsConfirmDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
              <DialogTitle>Complete consultation?</DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Finalizing this consultation will commit the current clinical documentation and transition the record into an immutable, read-only state.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>The linked appointment will be marked <strong>Completed</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Clinical notes and treatment records cannot be edited after finalization.</span>
            </div>
            {isDirty && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>Your current unsaved changes will be saved directly into the final permanent record.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isCompleting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmComplete} disabled={isCompleting} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              {isCompleting ? (
                <><Loader2 className="size-3.5 animate-spin" /> Completing...</>
              ) : (
                <><CheckCircle2 className="size-3.5" /> Complete Consultation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
