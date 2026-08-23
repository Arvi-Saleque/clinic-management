"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startOrResumeEncounterAction } from "@/lib/server/encounters";
import { cn } from "@/lib/utils";

interface ConsultationActionButtonProps {
  appointmentId: string;
  status: string;
  size?: "default" | "sm" | "xs" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  showIcon?: boolean;
}

export function ConsultationActionButton({
  appointmentId,
  status,
  size = "sm",
  variant,
  className,
  showIcon = true,
}: ConsultationActionButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // Presentation check: only confirmed, checked_in, and completed appointments are eligible
  if (status !== "confirmed" && status !== "checked_in" && status !== "completed") {
    return null;
  }

  const isConfirmed = status === "confirmed";
  const isCheckedIn = status === "checked_in";
  const isCompleted = status === "completed";

  let defaultVariant: "default" | "outline" | "secondary" | "ghost" = "default";
  let label = "Start Consultation";
  let pendingLabel = "Starting...";
  let Icon = Stethoscope;

  if (isConfirmed) {
    defaultVariant = "default";
    label = "Start Consultation";
    pendingLabel = "Starting...";
    Icon = Stethoscope;
  } else if (isCheckedIn) {
    defaultVariant = "default";
    label = "Open Consultation";
    pendingLabel = "Opening...";
    Icon = Stethoscope;
  } else if (isCompleted) {
    defaultVariant = "outline";
    label = "View Consultation";
    pendingLabel = "Loading...";
    Icon = FileText;
  }

  const resolvedVariant = variant ?? defaultVariant;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    setIsPending(true);

    try {
      const result = await startOrResumeEncounterAction(appointmentId);

      if (result.error) {
        toast.error(result.error);
        setIsPending(false);
        return;
      }

      if (result.data) {
        router.push(`/clinical/encounters/${result.data.encounter_id}`);
      }
    } catch {
      toast.error("Failed to open clinical consultation.");
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={resolvedVariant}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "h-7.5 px-2.5 text-[11px] font-semibold gap-1.5 transition-all rounded-lg cursor-pointer",
        isConfirmed && !variant && "bg-[#0B3B36] text-white hover:bg-[#0B3B36]/90 shadow-2xs",
        isCheckedIn && !variant && "bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 shadow-2xs",
        isCompleted && !variant && "border-border/80 text-foreground hover:bg-muted",
        className,
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        <>
          {showIcon && <Icon className="size-3.5" />}
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
