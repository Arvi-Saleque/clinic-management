"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-5">
      {/* Consultation Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="size-5 text-primary" />
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Clinical Documentation
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isCompleting ? (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Loader2 className="size-3 animate-spin" />
                  Finalizing consultation...
                </span>
              ) : isPendingSave ? (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="size-3 animate-spin" />
                  Saving draft...
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="size-3" />
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  {formattedSavedAt ? `Saved at ${formattedSavedAt}` : "All changes saved"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Save Draft Action */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!isDirty || isBusy}
            size="sm"
            className="gap-1.5"
          >
            {isPendingSave ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : !isDirty ? (
              <>
                <Check className="size-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Save Draft</span>
              </>
            )}
          </Button>

          {/* Complete Consultation Action */}
          <Button
            type="button"
            onClick={handleOpenCompleteDialog}
            disabled={isBusy}
            size="sm"
            className="gap-1.5 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 font-medium"
          >
            {isCompleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Complete Consultation</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Clinical Notes Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Chief Complaint */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="chief-complaint"
                className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
              >
                <FileHeart className="size-4 text-primary" />
                <span>Chief Complaint</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {chiefComplaint.length}/1000
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Textarea
              id="chief-complaint"
              value={chiefComplaint}
              disabled={isBusy}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Document the patient's presenting symptoms or primary dental concern..."
              rows={3}
              className="resize-y"
              aria-invalid={!!fieldErrors.chiefComplaint}
            />
            {fieldErrors.chiefComplaint && (
              <p className="text-xs text-destructive">{fieldErrors.chiefComplaint}</p>
            )}
          </CardContent>
        </Card>

        {/* Clinical Diagnosis */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="diagnosis"
                className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
              >
                <FileText className="size-4 text-primary" />
                <span>Clinical Diagnosis</span>
                <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {diagnosis.length}/1000
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
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
              placeholder="Enter diagnostic assessment, clinical findings, pathology (Required for completion)..."
              rows={3}
              className="resize-y"
              aria-invalid={!!fieldErrors.diagnosis}
            />
            {fieldErrors.diagnosis && (
              <p className="text-xs text-destructive">{fieldErrors.diagnosis}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performed Treatment */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="performed-treatment"
              className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
            >
              <FileCheck className="size-4 text-primary" />
              <span>Performed Treatment & Procedures</span>
              <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {performedTreatment.length}/1000
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
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
            placeholder="Document all procedures performed, tooth numbers treated, materials, anesthesia, techniques used (Required for completion)..."
            rows={4}
            className="resize-y"
            aria-invalid={!!fieldErrors.performedTreatment}
          />
          {fieldErrors.performedTreatment && (
            <p className="text-xs text-destructive">{fieldErrors.performedTreatment}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Patient-Facing Advice / Notes */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2.5">
            <Label
              htmlFor="patient-notes"
              className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
            >
              <MessageSquare className="size-4 text-primary" />
              <span>Patient Advice & Instructions</span>
            </Label>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300 font-normal"
            >
              <Eye className="mr-1 size-3" />
              Visible to patient
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Textarea
              id="patient-notes"
              value={patientNotes}
              disabled={isBusy}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="Post-operative care guidelines, home hygiene instructions, recommended OTC remedies..."
              rows={3}
              className="resize-y"
            />
          </CardContent>
        </Card>

        {/* Private Clinician Notes */}
        <Card className="border-slate-300/80 bg-slate-50/50 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2.5">
            <Label
              htmlFor="private-notes"
              className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
            >
              <Lock className="size-4 text-slate-700 dark:text-slate-300" />
              <span>Private Clinician Notes</span>
            </Label>
            <Badge
              variant="secondary"
              className="bg-slate-200/80 text-[10px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              Private — not visible to patient
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Textarea
              id="private-notes"
              value={privateNotes}
              disabled={isBusy}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Internal clinician reflections, differential diagnosis thoughts, staff observations..."
              rows={3}
              className="resize-y bg-background/80"
            />
          </CardContent>
        </Card>
      </div>

      {/* Follow-up & Recall Section */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Follow-up & Recall Recommendation
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="follow-up-switch"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                {followUpRecommended ? "Recommended" : "Not recommended"}
              </Label>
              <Switch
                id="follow-up-switch"
                checked={followUpRecommended}
                disabled={isBusy}
                onCheckedChange={(checked) => {
                  setFollowUpRecommended(checked);
                  if (!checked) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.followUpDate;
                      return next;
                    });
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {followUpRecommended ? (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="follow-up-date" className="text-xs font-medium text-foreground">
                    Target Follow-up Date <span className="text-destructive">*</span>
                  </Label>
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
                    className="bg-background"
                  />
                  {fieldErrors.followUpDate && (
                    <p className="text-xs text-destructive">{fieldErrors.followUpDate}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="follow-up-reason" className="text-xs font-medium text-foreground">
                    Follow-up Reason / Clinical Objective
                  </Label>
                  <Input
                    id="follow-up-reason"
                    type="text"
                    value={followUpReason}
                    disabled={isBusy}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="e.g. Suture removal, crown cementation, 2-week review..."
                    className="bg-background"
                    maxLength={500}
                  />
                  {fieldErrors.followUpReason && (
                    <p className="text-xs text-destructive">{fieldErrors.followUpReason}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No follow-up visit is currently recommended for this consultation. Switch on to plan a recall.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Irreversible Consultation Completion */}
      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!isCompleting) {
            setIsConfirmDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
              <DialogTitle>Complete consultation?</DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              Finalizing this consultation will commit the current clinical documentation and transition the record into an immutable, read-only state.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>The linked appointment will be marked <strong>Completed</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="size-4 text-primary shrink-0 mt-0.5" />
              <span>Clinical notes and treatment records cannot be edited after finalization.</span>
            </div>
            {isDirty && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>Your current unsaved changes will be saved directly into the final permanent record.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmComplete}
              disabled={isCompleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Complete Consultation</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
