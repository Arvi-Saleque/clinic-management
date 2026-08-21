"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  Info,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModernTimePicker } from "./modern-time-picker";
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
  isReadOnly?: boolean;
}

const LEAVE_PRESETS = [
  "Vacation / Holiday",
  "Medical Leave",
  "Conference / Training",
  "Personal Day",
];

function getSlotDuration(start: string, end: string) {
  if (!start || !end || start >= end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin <= 0) return "";
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs}h ${mins}m`;
}

function getTotalWorkingHours(intervals: TimeInterval[]) {
  let totalMin = 0;
  for (const inv of intervals) {
    if (inv.startTime && inv.endTime && inv.startTime < inv.endTime) {
      const [sh, sm] = inv.startTime.split(":").map(Number);
      const [eh, em] = inv.endTime.split(":").map(Number);
      totalMin += eh * 60 + em - (sh * 60 + sm);
    }
  }
  if (totalMin <= 0) return null;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hrs`;
  return `${hrs}h ${mins}m`;
}

export function AvailabilityDayDetailsPanel({
  practitionerId,
  selectedDate,
  source,
  isInitialAvailable,
  initialIntervals,
  initialLeaveReason = null,
  onSuccess,
  isReadOnly = false,
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
  const dayOfWeekName = format(parsedDate, "EEEE");
  const restOfDate = format(parsedDate, "d MMMM yyyy");

  // Detect if user made any edits
  const hasChanges = React.useMemo(() => {
    // 1. Status toggle changed
    if (isAvailable !== isInitialAvailable) return true;

    // 2. If On Leave, check if reason changed
    if (!isAvailable) {
      const origReason = (initialLeaveReason || "").trim();
      return leaveReason.trim() !== origReason;
    }

    // 3. If Available, check intervals
    if (intervals.length !== initialIntervals.length) return true;

    for (let i = 0; i < intervals.length; i++) {
      const cur = intervals[i];
      const init = initialIntervals[i];
      if (!init) return true;
      if (cur.startTime !== init.startTime || cur.endTime !== init.endTime) {
        return true;
      }
    }

    return false;
  }, [isAvailable, isInitialAvailable, leaveReason, initialLeaveReason, intervals, initialIntervals]);

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

  const totalHoursStr = React.useMemo(() => getTotalWorkingHours(intervals), [intervals]);

  // -------------------------------------------------------------------
  // READ-ONLY VIEW (FOR RECEPTIONIST)
  // -------------------------------------------------------------------
  if (isReadOnly) {
    const isWorking = isInitialAvailable && initialIntervals.length > 0;
    const isLeave = source === "full_day_leave";

    return (
      <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="border-b border-border/60 pb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Calendar className="size-3.5" />
              <span>Selected Date</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                isLeave
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                  : source === "date_override"
                    ? "border-purple-300 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                    : isWorking
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {isLeave
                ? "On Leave"
                : source === "date_override"
                  ? "Adjusted Hours"
                  : isWorking
                    ? "Regular Routine"
                    : "Day Off"}
            </Badge>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {dayOfWeekName}
            </span>
            <h3 className="font-heading text-xl font-black text-foreground">
              {restOfDate}
            </h3>
          </div>
        </div>

        {/* Working Hours Display */}
        <div className="space-y-3">
          <Label className="text-xs font-extrabold text-foreground tracking-tight">
            Working Schedule
          </Label>

          {isWorking ? (
            <div className="space-y-2">
              {initialIntervals.map((inv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                      <Clock className="size-3.5" />
                    </div>
                    <span className="font-heading text-sm font-black tabular-nums text-foreground">
                      {inv.startTime} – {inv.endTime}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    {getSlotDuration(inv.startTime, inv.endTime) || "Available"}
                  </span>
                </div>
              ))}
            </div>
          ) : isLeave ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 dark:bg-amber-950/40 p-5 text-center space-y-1.5 shadow-2xs">
              <CalendarOff className="size-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-black text-amber-950 dark:text-amber-200">
                Doctor is On Leave
              </p>
              {initialLeaveReason && (
                <p className="text-xs text-amber-900/80 dark:text-amber-300 italic font-medium">
                  &ldquo;{initialLeaveReason}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-5 text-center shadow-2xs">
              <p className="text-xs font-bold text-muted-foreground">
                Scheduled Day Off
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                No working hours scheduled for this date.
              </p>
            </div>
          )}
        </div>

        {/* Read-Only Notice */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-muted/30 border border-border/60 p-3.5 text-xs text-muted-foreground leading-relaxed">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <span className="text-[11px]">
            Front desk read-only view. Dentists manage their own clinical schedules and availability.
          </span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // EDITABLE VIEW (FOR DENTIST & OWNER ADMIN)
  // -------------------------------------------------------------------
  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      {/* Header Banner */}
      <div className="border-b border-border/60 pb-4 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
            <CalendarDays className="size-3.5" />
            <span>Selected Date</span>
          </div>

          {/* Source Tag */}
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
              isOverride
                ? "bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                : "bg-muted/40 text-muted-foreground border-border/60",
            )}
          >
            {isOverride ? "Custom Override" : "Weekly Routine"}
          </span>
        </div>

        <div className="pt-1">
          <span className="text-xs font-extrabold text-teal-800/80 dark:text-teal-400 uppercase tracking-wider block">
            {dayOfWeekName}
          </span>
          <h3 className="font-heading text-xl font-black text-foreground tracking-tight">
            {restOfDate}
          </h3>
        </div>
      </div>

      {/* Status Segmented Buttons */}
      <div className="space-y-2">
        <Label className="text-xs font-extrabold text-foreground tracking-tight">
          Status
        </Label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsAvailable(true)}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-2xl text-xs font-black transition-all border outline-none cursor-pointer",
              isAvailable
                ? "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-500 shadow-xs scale-[1.01]"
                : "bg-card text-muted-foreground hover:bg-muted/40 border-border/80 hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "size-5 rounded-lg flex items-center justify-center",
                isAvailable ? "bg-emerald-600 text-white" : "bg-muted/40 text-muted-foreground",
              )}
            >
              <Check className="size-3" />
            </div>
            Available
          </button>

          <button
            type="button"
            onClick={() => setIsAvailable(false)}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-2xl text-xs font-black transition-all border outline-none cursor-pointer",
              !isAvailable
                ? "bg-amber-50 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-500/20 dark:bg-amber-950/60 dark:text-amber-100 dark:border-amber-500 shadow-xs scale-[1.01]"
                : "bg-card text-muted-foreground hover:bg-muted/40 border-border/80 hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "size-5 rounded-lg flex items-center justify-center",
                !isAvailable ? "bg-amber-600 text-white" : "bg-muted/40 text-muted-foreground",
              )}
            >
              <CalendarOff className="size-3" />
            </div>
            On Leave
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">
          {isAvailable
            ? "This is an available working day for appointments."
            : "Doctor is unavailable on this date."}
        </p>
      </div>

      {/* Leave Reason Input & Preset Chips (if On Leave) */}
      {!isAvailable && (
        <div className="space-y-2 pt-1">
          <Label htmlFor="leave-reason-input" className="text-xs font-extrabold text-foreground">
            Leave Reason <span className="text-muted-foreground font-normal text-[11px]">(optional)</span>
          </Label>
          <Input
            id="leave-reason-input"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="e.g. Vacation, Medical Leave, Conference"
            className="h-10 text-xs rounded-xl bg-card border-border/80 focus-visible:ring-emerald-500"
          />

          {/* Quick Preset Reason Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {LEAVE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLeaveReason(preset)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                  leaveReason === preset
                    ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Working Hours Interval List (if Available) */}
      {isAvailable && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-extrabold text-foreground tracking-tight">
                Working Hours
              </Label>
              {totalHoursStr && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {totalHoursStr}
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddInterval}
              className="h-8 gap-1.5 rounded-xl px-3 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-emerald-200/80 dark:border-emerald-800 transition-all shadow-2xs"
            >
              <Plus className="size-3.5" />
              Add Slot
            </Button>
          </div>

          <div className="space-y-2.5">
            {intervals.map((inv, idx) => {
              const duration = getSlotDuration(inv.startTime, inv.endTime);

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-muted/15 p-3 space-y-2 transition-all hover:border-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Slot {idx + 1}
                    </span>
                    {duration && (
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                        {duration}
                      </span>
                    )}
                  </div>

                  {/* Modern Time Picker Pair */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ModernTimePicker
                        value={inv.startTime}
                        onChange={(val) => handleUpdateInterval(idx, "startTime", val)}
                        align="left"
                      />
                    </div>
                    <span className="text-muted-foreground font-black text-xs select-none px-0.5">
                      –
                    </span>
                    <div className="flex-1">
                      <ModernTimePicker
                        value={inv.endTime}
                        onChange={(val) => handleUpdateInterval(idx, "endTime", val)}
                        align="right"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInterval(idx)}
                      disabled={intervals.length <= 1}
                      className="size-8.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                      title="Remove interval"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safeguards Notice Box */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 p-3.5 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
        <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed font-medium">
          Changes apply only to this date. Existing bookings remain active.
        </p>
      </div>

      {/* Action Buttons Footer - Only visible when changes exist or override can be reset */}
      {(hasChanges || isOverride || isSaving) && (
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          {isOverride && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isResetting || isSaving}
              className="h-10 gap-1.5 rounded-2xl px-4 text-xs font-bold border-border/80 hover:bg-muted/50 transition-all"
            >
              {isResetting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Reset to Routine
            </Button>
          )}

          {(hasChanges || isSaving) && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="h-10 gap-2 rounded-2xl px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#075e5a] text-white shadow-md shadow-[#0B3B36]/25 transition-all hover:scale-[1.02] active:scale-[0.98] animate-in fade-in-0 zoom-in-95 duration-150"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
