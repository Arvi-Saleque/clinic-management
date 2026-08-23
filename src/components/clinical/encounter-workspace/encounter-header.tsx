"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Hourglass,
  Lock,
  MapPin,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EncounterWorkspaceContext } from "@/types/clinical";
import { formatClinicDate, formatClinicTime } from "@/lib/utils";

interface EncounterHeaderProps {
  context: EncounterWorkspaceContext;
  isDirty?: boolean;
  onCompleteConsultation?: () => void;
}

export function EncounterHeader({
  context,
  isDirty = false,
  onCompleteConsultation,
}: EncounterHeaderProps) {
  const router = useRouter();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { encounter, patient, appointment } = context;

  const backHref = "/scheduler";

  const handleBackClick = (e: React.MouseEvent) => {
    if (context.is_editable && isDirty) {
      e.preventDefault();
      setIsLeaveDialogOpen(true);
    }
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    router.push(backHref);
  };

  const startedFormatted = encounter.started_at
    ? formatClinicDate(encounter.started_at)
    : appointment?.starts_at
      ? formatClinicDate(appointment.starts_at)
      : null;

  const appointmentTime = appointment?.starts_at
    ? formatClinicTime(appointment.starts_at)
    : encounter.started_at
      ? formatClinicTime(encounter.started_at)
      : null;

  const serviceName = appointment?.service_name ?? "General Dental Consultation";
  const duration = appointment?.service_duration ?? 45;
  const branchName = appointment?.branch_name;

  return (
    <header className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-6 shadow-xs space-y-5">
      {/* Top Row: Back button + Live Status Badge + Universal Complete Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        {context.is_editable && isDirty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="-ml-2 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Scheduler</span>
          </Button>
        ) : (
          <ButtonLink
            href={backHref}
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Scheduler</span>
          </ButtonLink>
        )}

        <div className="flex items-center gap-3">
          {encounter.status === "in_progress" ? (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.8)]" />
                Consultation in progress
              </span>

              {/* Universal Complete Button from ANY page */}
              {context.is_editable && onCompleteConsultation && (
                <Button
                  type="button"
                  onClick={onCompleteConsultation}
                  size="sm"
                  className="h-8.5 px-4 rounded-xl text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs gap-1.5 cursor-pointer"
                >
                  <Check className="size-3.5 stroke-[2.5]" />
                  <span>Complete Consultation</span>
                </Button>
              )}
            </div>
          ) : encounter.status === "completed" ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold bg-emerald-100/70 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                Completed &amp; Signed
              </span>
              <Badge variant="secondary" className="hidden gap-1 text-xs text-muted-foreground sm:flex rounded-xl font-bold">
                <Lock className="size-3" />
                Read-only Record
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive rounded-full"
            >
              <XCircle className="mr-1.5 size-3.5" />
              Cancelled
            </Badge>
          )}
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle className="font-heading font-extrabold text-base">Leave without saving?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-xs text-muted-foreground leading-relaxed">
              You have unsaved clinical documentation changes. If you leave now, those modifications will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-border/50 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsLeaveDialogOpen(false)} className="rounded-xl text-xs font-bold h-9">
              Stay in Consultation
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmLeave} className="rounded-xl text-xs font-bold h-9">
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Name + Identification + Clinical Metadata Details */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {patient.full_name}
          </h1>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 px-3 py-0.5 font-mono text-xs font-bold shadow-2xs">
            {patient.patient_reference}
          </span>
        </div>

        {/* Metadata Details Chips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-muted-foreground">
          {startedFormatted && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/60 text-foreground">
              <CalendarDays className="size-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{startedFormatted}</span>
            </span>
          )}
          {appointmentTime && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/60 text-foreground">
              <Clock3 className="size-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{appointmentTime}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/60 text-foreground">
            <Stethoscope className="size-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{serviceName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/60 text-foreground">
            <Hourglass className="size-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{duration} mins</span>
          </span>
          {branchName && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-1.5 border border-border/60 text-foreground">
              <MapPin className="size-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{branchName}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
