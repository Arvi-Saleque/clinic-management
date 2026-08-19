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
    : null;

  const appointmentTime = appointment?.starts_at
    ? format(new Date(appointment.starts_at), "h:mm a")
    : encounter.started_at
      ? format(new Date(encounter.started_at), "h:mm a")
      : null;

  return (
    <header className="border-b border-border/60 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {context.is_editable && isDirty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Appointments
          </Button>
        ) : (
          <ButtonLink
            href={backHref}
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Appointments
          </ButtonLink>
        )}

        {encounter.status === "in_progress" ? (
          <Badge
            variant="outline"
            className="border-emerald-500/25 bg-emerald-500/8 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300"
          >
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500" />
            Consultation in progress
          </Badge>
        ) : encounter.status === "completed" ? (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/25 bg-emerald-500/8 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Completed
            </Badge>
            <Badge variant="secondary" className="hidden gap-1 text-xs text-muted-foreground sm:flex">
              <Lock className="size-3" />
              Read-only
            </Badge>
          </div>
        ) : (
          <Badge
            variant="outline"
            className="border-destructive/25 bg-destructive/8 px-3 py-1 font-medium text-destructive"
          >
            <XCircle className="mr-1.5 size-3.5" />
            Cancelled
          </Badge>
        )}
      </div>

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

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.035em] text-foreground sm:text-[32px]">
            {patient.full_name}
          </h1>
          <span className="rounded-lg border border-primary/10 bg-primary-soft/55 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary">
            {patient.patient_reference}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          {startedFormatted && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {startedFormatted}
            </span>
          )}
          {appointmentTime && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {appointmentTime}
            </span>
          )}
          {appointment?.service_name && (
            <span className="flex items-center gap-1.5">
              <Stethoscope className="size-3.5" />
              {appointment.service_name}
            </span>
          )}
          {appointment?.service_duration !== null && appointment?.service_duration !== undefined && (
            <span className="text-muted-foreground/80">{appointment.service_duration} mins</span>
          )}
        </div>
      </div>
    </header>
  );
}
