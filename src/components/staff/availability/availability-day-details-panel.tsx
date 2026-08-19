"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveDayAvailabilityOverrideAction,
  resetDayAvailabilityOverrideAction,
} from "@/lib/server/appointments";
import type { DayScheduleSource, TimeInterval } from "@/types/availability";
import { cn } from "@/lib/utils";

interface AvailabilityDayDetailsPanelProps {
  practitionerId: string;
  selectedDate: string;
  source: DayScheduleSource;
  isInitialAvailable: boolean;
  initialIntervals: TimeInterval[];
  initialLeaveReason?: string | null;
  onSuccess: () => void;
}

export function AvailabilityDayDetailsPanel({
  practitionerId,
  selectedDate,
  source,
  isInitialAvailable,
  initialIntervals,
  initialLeaveReason = null,
  onSuccess,
}: AvailabilityDayDetailsPanelProps) {
  const isOverride = source === "date_override" || source === "full_day_leave";

  // Form state
  const [isAvailable, setIsAvailable] = React.useState<boolean>(isInitialAvailable);
  const [leaveReason, setLeaveReason] = React.useState<string>(initialLeaveReason || "");
  const [intervals, setIntervals] = React.useState<TimeInterval[]>(() => {
    if (initialIntervals.length > 0) return [...initialIntervals];
    return [{ startTime: "09:00", endTime: "17:00" }];
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  }, [selectedDate]);

  const formattedDate = format(parsedDate, "EEEE, d MMMM yyyy");

  // Interval handlers
  const handleAddInterval = () => {
    let nextStart = "14:00";
    let nextEnd = "18:00";
    if (intervals.length > 0) {
      const last = intervals[intervals.length - 1];
      nextStart = last.endTime;
      const [h, m] = last.endTime.split(":").map(Number);
      const endH = Math.min(23, h + 4);
      nextEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    setIntervals((prev) => [...prev, { startTime: nextStart, endTime: nextEnd }]);
  };

  const handleUpdateInterval = (index: number, field: "startTime" | "endTime", val: string) => {
    setIntervals((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, [field]: val } : inv)),
    );
  };

  const handleRemoveInterval = (index: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Override Save
  const handleSave = async () => {
    if (isAvailable && intervals.length === 0) {
      toast.error("Please add at least one working interval or mark as On Leave");
      return;
    }

    if (isAvailable) {
      for (let i = 0; i < intervals.length; i++) {
        const inv = intervals[i];
        if (!inv.startTime || !inv.endTime || inv.startTime >= inv.endTime) {
          toast.error(`Slot ${i + 1}: Start time must be before end time`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const res = await saveDayAvailabilityOverrideAction({
        practitionerId,
        date: selectedDate,
        isUnavailable: !isAvailable,
        reason: !isAvailable ? leaveReason.trim() || undefined : undefined,
        intervals: isAvailable ? intervals : [],
      });

      if (res.success) {
        toast.success(`Availability updated for ${format(parsedDate, "d MMM yyyy")}`);
        onSuccess();
      } else {
        toast.error(res.error ?? "Failed to save availability");
      }
    } catch {
      toast.error("An unexpected error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Override to Weekly Routine
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetDayAvailabilityOverrideAction({
        practitionerId,
        date: selectedDate,
      });

      if (res.success) {
        toast.success(`Reset to weekly routine for ${format(parsedDate, "d MMM yyyy")}`);
        onSuccess();
      } else {
        toast.error(res.error ?? "Failed to reset availability");
      }
    } catch {
      toast.error("An unexpected error occurred while resetting");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3.5 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
          <CalendarDays className="size-3.5" />
          <span>Selected Date</span>
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">
          {formattedDate}
        </h3>
      </div>

      {/* Status Segmented Buttons */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">
          Status
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsAvailable(true)}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold transition-all border",
              isAvailable
                ? "bg-emerald-50/80 text-emerald-900 border-2 border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500 shadow-2xs"
                : "bg-card text-muted-foreground hover:bg-muted/40 border-border/60",
            )}
          >
            <CalendarDays className={cn("size-4", isAvailable ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")} />
            Available
          </button>
          <button
            type="button"
            onClick={() => setIsAvailable(false)}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold transition-all border",
              !isAvailable
                ? "bg-amber-50/80 text-amber-900 border-2 border-amber-600 ring-2 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500 shadow-2xs"
                : "bg-card text-muted-foreground hover:bg-muted/40 border-border/60",
            )}
          >
            <CalendarOff className={cn("size-4", !isAvailable ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")} />
            On Leave
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isAvailable
            ? "This is an available working day."
            : "Marked as leave for this day."}
        </p>
      </div>

      {/* Leave Reason Input (if On Leave) */}
      {!isAvailable && (
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="leave-reason-input" className="text-xs font-semibold text-foreground">
            Leave Reason <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="leave-reason-input"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="e.g. Vacation, Medical Leave, Conference"
            className="h-9.5 text-xs rounded-xl bg-card border-border/80"
          />
        </div>
      )}

      {/* Working Hours Interval List (if Available) */}
      {isAvailable && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">
              Working Hours
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddInterval}
              className="h-7.5 gap-1 rounded-xl px-2.5 text-[11px] font-bold text-primary hover:bg-primary-soft/30"
            >
              <Plus className="size-3" />
              Add Slot
            </Button>
          </div>

          <div className="space-y-2">
            {intervals.map((inv, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/15 p-2 transition-colors"
              >
                <div className="relative flex-1">
                  <Clock className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
                  <Input
                    type="time"
                    value={inv.startTime}
                    onChange={(e) => handleUpdateInterval(idx, "startTime", e.target.value)}
                    className="h-8.5 text-xs rounded-lg pl-8 pr-2 font-bold tabular-nums bg-card border-border/80"
                  />
                </div>
                <span className="text-muted-foreground font-bold text-xs select-none">–</span>
                <div className="relative flex-1">
                  <Input
                    type="time"
                    value={inv.endTime}
                    onChange={(e) => handleUpdateInterval(idx, "endTime", e.target.value)}
                    className="h-8.5 text-xs rounded-lg px-2 font-bold tabular-nums bg-card border-border/80 text-center"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveInterval(idx)}
                  disabled={intervals.length <= 1}
                  className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  title="Remove interval"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safeguards Notice Box */}
      <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 p-3 text-xs text-emerald-900 dark:text-emerald-300">
        <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Changes apply only to this date. Existing bookings remain active.
        </p>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
        {isOverride && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 hover:bg-muted/50"
          >
            {isResetting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Reset
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isResetting}
          className="h-9.5 gap-1.5 rounded-xl px-5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs"
        >
          {isSaving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
