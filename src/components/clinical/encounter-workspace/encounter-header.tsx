"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hourglass,
  Lock,
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

interface EncounterHeaderProps {
  context: EncounterWorkspaceContext;
  isDirty?: boolean;
}

export function EncounterHeader({ context, isDirty = false }: EncounterHeaderProps) {
  const router = useRouter();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { encounter, patient, appointment } = context;

  const backHref = "/appointments";

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
    ? format(new Date(encounter.started_at), "MMM d, yyyy")
    : appointment?.starts_at
      ? format(new Date(appointment.starts_at), "MMM d, yyyy")
      : null;

  const appointmentTime = appointment?.starts_at
    ? format(new Date(appointment.starts_at), "h:mm a")
    : encounter.started_at
      ? format(new Date(encounter.started_at), "h:mm a")
      : null;

  const serviceName = appointment?.service_name ?? "General Dental Consultation";
  const duration = appointment?.service_duration ?? 30;

  return (
    <header className="space-y-3">
      {/* Top Row: Back button + Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {context.is_editable && isDirty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="-ml-2 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Appointments
          </Button>
        ) : (
          <ButtonLink
            href={backHref}
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Appointments
          </ButtonLink>
        )}

        {encounter.status === "in_progress" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Consultation in progress
          </span>
        ) : encounter.status === "completed" ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Completed
            </span>
            <Badge variant="secondary" className="hidden gap-1 text-xs text-muted-foreground sm:flex">
              <Lock className="size-3" />
              Read-only
            </Badge>
          </div>
        ) : (
          <Badge
            variant="outline"
            className="border-destructive/25 bg-destructive/8 px-3 py-1 text-xs font-medium text-destructive"
          >
            <XCircle className="mr-1.5 size-3.5" />
            Cancelled
          </Badge>
        )}
      </div>

      {/* Leave Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle>Leave without saving?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              You have unsaved consultation changes. If you leave now, those changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
              Stay
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmLeave}>
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Name + Metadata Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {patient.full_name}
          </h1>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 dark:bg-emerald-950/50 dark:border-emerald-800/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            {patient.patient_reference}
          </span>
        </div>

        {/* Metadata Details Row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-muted-foreground">
          {startedFormatted && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-muted-foreground/70" />
              {startedFormatted}
            </span>
          )}
          {appointmentTime && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5 text-muted-foreground/70" />
              {appointmentTime}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Stethoscope className="size-3.5 text-muted-foreground/70" />
            {serviceName}
          </span>
          <span className="flex items-center gap-1.5">
            <Hourglass className="size-3.5 text-muted-foreground/70" />
            {duration} mins
          </span>
        </div>
      </div>
    </header>
  );
}
