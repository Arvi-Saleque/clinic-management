"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModernTimePicker } from "./modern-time-picker";
import { saveMultiIntervalWeeklyAvailability } from "@/lib/server/appointments";
import type { DayAvailability, TimeInterval } from "@/types/availability";
import { cn } from "@/lib/utils";

const DAYS = [
  { dow: 1, label: "Mon", fullName: "Monday", isWeekend: false },
  { dow: 2, label: "Tue", fullName: "Tuesday", isWeekend: false },
  { dow: 3, label: "Wed", fullName: "Wednesday", isWeekend: false },
  { dow: 4, label: "Thu", fullName: "Thursday", isWeekend: false },
  { dow: 5, label: "Fri", fullName: "Friday", isWeekend: false },
  { dow: 6, label: "Sat", fullName: "Saturday", isWeekend: true },
  { dow: 0, label: "Sun", fullName: "Sunday", isWeekend: true },
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

function getDayTotalHours(intervals: TimeInterval[]) {
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

interface WeeklyRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practitionerId: string;
  initialRules: Record<number, DayAvailability>;
  focusedWeekday?: number | null;
  onSuccess: () => void;
}

export function WeeklyRoutineDialog({
  open,
  onOpenChange,
  practitionerId,
  initialRules,
  focusedWeekday = null,
  onSuccess,
}: WeeklyRoutineDialogProps) {
  // Active day tab state (defaults to clicked day or Monday)
  const [activeDow, setActiveDow] = React.useState<number>(() => focusedWeekday ?? 1);

  // Synchronize when focusedWeekday prop changes
  React.useEffect(() => {
    if (focusedWeekday !== null && focusedWeekday !== undefined) {
      setActiveDow(focusedWeekday);
    }
  }, [focusedWeekday]);

  const [schedule, setSchedule] = React.useState<Record<number, DayAvailability>>(() => {
    const next: Record<number, DayAvailability> = {};
    for (const d of DAYS) {
      if (initialRules[d.dow]) {
        next[d.dow] = {
          dayOfWeek: d.dow,
          enabled: initialRules[d.dow].enabled,
          intervals: [...initialRules[d.dow].intervals],
        };
      } else {
        next[d.dow] = {
          dayOfWeek: d.dow,
          enabled: false,
          intervals: [{ startTime: "09:00", endTime: "17:00" }],
        };
      }
    }
    return next;
  });

  const [isSaving, setIsSaving] = React.useState(false);

  const activeDay = schedule[activeDow] ?? {
    dayOfWeek: activeDow,
    enabled: false,
    intervals: [{ startTime: "09:00", endTime: "17:00" }],
  };

  const activeDayMeta = DAYS.find((d) => d.dow === activeDow) ?? DAYS[0];

  const handleToggleActiveDay = (checked: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [activeDow]: {
        ...prev[activeDow],
        enabled: checked,
        intervals:
          prev[activeDow]?.intervals && prev[activeDow].intervals.length > 0
            ? prev[activeDow].intervals
            : [{ startTime: "09:00", endTime: "17:00" }],
      },
    }));
  };

  const handleAddInterval = () => {
    setSchedule((prev) => {
      const current = prev[activeDow];
      let nextStart = "14:00";
      let nextEnd = "18:00";
      if (current.intervals.length > 0) {
        const last = current.intervals[current.intervals.length - 1];
        nextStart = last.endTime;
        const [h, m] = last.endTime.split(":").map(Number);
        const endH = Math.min(23, h + 4);
        nextEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
      return {
        ...prev,
        [activeDow]: {
          ...current,
          intervals: [...current.intervals, { startTime: nextStart, endTime: nextEnd }],
        },
      };
    });
  };

  const handleUpdateInterval = (
    index: number,
    field: "startTime" | "endTime",
    val: string,
  ) => {
    setSchedule((prev) => {
      const current = prev[activeDow];
      const nextIntervals = current.intervals.map((inv, i) =>
        i === index ? { ...inv, [field]: val } : inv,
      );
      return {
        ...prev,
        [activeDow]: {
          ...current,
          intervals: nextIntervals,
        },
      };
    });
  };

  const handleRemoveInterval = (index: number) => {
    setSchedule((prev) => {
      const current = prev[activeDow];
      const nextIntervals = current.intervals.filter((_, i) => i !== index);
      return {
        ...prev,
        [activeDow]: {
          ...current,
          intervals: nextIntervals,
        },
      };
    });
  };

  // Duplicate current day's hours to all weekdays (Mon–Fri)
  const handleCopyToAllWeekdays = () => {
    if (!activeDay.enabled || activeDay.intervals.length === 0) {
      toast.error("Please configure and enable working hours first before copying");
      return;
    }

    const currentIntervals = [...activeDay.intervals];
    setSchedule((prev) => {
      const next = { ...prev };
      // Mon (1) through Fri (5)
      for (let dow = 1; dow <= 5; dow++) {
        next[dow] = {
          dayOfWeek: dow,
          enabled: true,
          intervals: currentIntervals.map((inv) => ({ ...inv })),
        };
      }
      return next;
    });

    toast.success(`Copied ${activeDayMeta.fullName} hours to Monday – Friday`);
  };

  const handleSave = async () => {
    // Validate enabled intervals
    for (const d of DAYS) {
      const day = schedule[d.dow];
      if (day.enabled) {
        if (day.intervals.length === 0) {
          toast.error(`${d.fullName}: Please add at least one interval or mark as Day Off.`);
          setActiveDow(d.dow);
          return;
        }
        for (let i = 0; i < day.intervals.length; i++) {
          const inv = day.intervals[i];
          if (!inv.startTime || !inv.endTime || inv.startTime >= inv.endTime) {
            toast.error(`${d.fullName} slot ${i + 1}: Start time must be before end time.`);
            setActiveDow(d.dow);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const daysPayload: DayAvailability[] = DAYS.map((d) => schedule[d.dow]);
      const res = await saveMultiIntervalWeeklyAvailability({
        practitionerId,
        days: daysPayload,
      });

      if (!res.error) {
        toast.success("Weekly routine updated successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to save weekly routine");
      }
    } catch {
      toast.error("An unexpected error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const dayTotalHoursStr = activeDay.enabled ? getDayTotalHours(activeDay.intervals) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-3.5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-gradient-to-br from-[#0B3B36] to-[#075e5a] text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarDays className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="font-heading text-lg font-black text-foreground tracking-tight">
                Edit Weekly Routine
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure your recurring weekly schedule for each day of the week.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ------------------------------------------------------------- */}
        {/* Day Selector Pill Tabs Bar                                    */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
            Select Day to Edit
          </span>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-muted/30 border border-border/70">
            {DAYS.map((d) => {
              const isActive = activeDow === d.dow;
              const isDayEnabled = schedule[d.dow]?.enabled && schedule[d.dow].intervals.length > 0;

              return (
                <button
                  key={d.dow}
                  type="button"
                  onClick={() => setActiveDow(d.dow)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer relative outline-none",
                    isActive
                      ? "bg-[#0B3B36] text-white shadow-sm scale-[1.03] z-10"
                      : "text-foreground hover:bg-card hover:shadow-2xs",
                  )}
                >
                  <span>{d.label}</span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full mt-1 transition-colors",
                      isActive
                        ? "bg-emerald-300"
                        : isDayEnabled
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Active Day Focused Card Editor                                */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Day Title & Status Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-black text-foreground">
                  {activeDayMeta.fullName}
                </h3>
                {dayTotalHoursStr && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    {dayTotalHoursStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeDay.enabled
                  ? "Open for patient appointments on this day"
                  : "Closed / No appointments offered on this day"}
              </p>
            </div>

            {/* Status Toggle Segmented Control */}
            <div className="inline-flex rounded-xl bg-muted/40 p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => handleToggleActiveDay(true)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  activeDay.enabled
                    ? "bg-[#0B3B36] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Working Day
              </button>
              <button
                type="button"
                onClick={() => handleToggleActiveDay(false)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  !activeDay.enabled
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Day Off
              </button>
            </div>
          </div>

          {/* Day Working Hours Intervals */}
          {activeDay.enabled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-foreground">
                  Shift Intervals
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInterval}
                  className="h-7.5 gap-1 rounded-xl px-2.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 border-emerald-200/80 dark:border-emerald-800 transition-all shadow-2xs"
                >
                  <Plus className="size-3" /> Add Shift
                </Button>
              </div>

              <div className="space-y-2.5">
                {activeDay.intervals.map((inv, idx) => {
                  const duration = getSlotDuration(inv.startTime, inv.endTime);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/80 bg-muted/15 p-3 space-y-2"
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

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <ModernTimePicker
                            value={inv.startTime}
                            onChange={(val) => handleUpdateInterval(idx, "startTime", val)}
                            align="left"
                          />
                        </div>

                        <span className="text-muted-foreground font-black text-xs px-0.5">–</span>

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
                          disabled={activeDay.intervals.length <= 1}
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

              {/* Quick Copy Shortcut */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-border/40">
                <span className="text-[11px] text-muted-foreground">
                  Need the same hours on other days?
                </span>
                <button
                  type="button"
                  onClick={handleCopyToAllWeekdays}
                  className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="size-3" /> Copy to Mon–Fri
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-muted/10 text-center space-y-1.5">
              <Clock className="size-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-xs font-bold text-muted-foreground">
                {activeDayMeta.fullName} is set as Day Off
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Click &ldquo;Working Day&rdquo; above if you want to open appointments for this day.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/60 pt-3.5 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-2xl px-4 text-xs font-bold border-border/80 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 gap-2 rounded-2xl px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#075e5a] text-white shadow-md shadow-[#0B3B36]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
