"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
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

  const handleBackClick = (e: React.MouseEvent) => {
    if (context.is_editable && isDirty) {
      e.preventDefault();
      setIsLeaveDialogOpen(true);
    }
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    router.push("/scheduler");
  };

  const startedFormatted = encounter.started_at
    ? format(new Date(encounter.started_at), "MMM d, yyyy · h:mm a")
    : null;

  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-5">
      <div className="flex items-center justify-between">
        {context.is_editable && isDirty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Scheduler
          </Button>
        ) : (
          <ButtonLink
            href="/scheduler"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Scheduler
          </ButtonLink>
        )}

        {/* Leave Without Saving Confirmation Dialog */}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLeaveDialogOpen(false)}
              >
                Stay
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmLeave}
              >
                Leave without saving
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2">
          {encounter.status === "in_progress" ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300"
            >
              <span className="mr-1.5 size-2 animate-pulse rounded-full bg-emerald-500" />
              Consultation in progress
            </Badge>
          ) : encounter.status === "completed" ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 px-3 py-1 font-medium text-blue-700 dark:text-blue-300"
              >
                <CheckCircle2 className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
                Completed consultation
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-muted/80 text-xs text-muted-foreground"
              >
                <Lock className="size-3" />
                Read-only record
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 px-3 py-1 font-medium text-destructive"
            >
              <XCircle className="mr-1.5 size-3.5" />
              Cancelled encounter
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {patient.full_name}
            </h1>
            <span className="rounded-md border border-border/80 bg-muted/50 px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              {patient.patient_reference}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
            {startedFormatted && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                <span>Started: {startedFormatted}</span>
              </span>
            )}
            {appointment?.service_name && (
              <span className="flex items-center gap-1.5">
                <Stethoscope className="size-3.5 text-primary" />
                <span>Booked Service: <strong className="font-medium text-foreground">{appointment.service_name}</strong></span>
              </span>
            )}
            {appointment?.starts_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Appointment Slot: {format(new Date(appointment.starts_at), "h:mm a")}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
