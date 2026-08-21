"use client";

import * as React from "react";
import { Check, Clock, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { ModernTimePicker } from "./modern-time-picker";
import { saveMultiIntervalWeeklyAvailability } from "@/lib/server/appointments";
import type { DayAvailability } from "@/types/availability";
import { cn } from "@/lib/utils";

const DAYS = [
  { dow: 1, label: "Monday", short: "Mon" },
  { dow: 2, label: "Tuesday", short: "Tue" },
  { dow: 3, label: "Wednesday", short: "Wed" },
  { dow: 4, label: "Thursday", short: "Thu" },
  { dow: 5, label: "Friday", short: "Fri" },
  { dow: 6, label: "Saturday", short: "Sat" },
  { dow: 0, label: "Sunday", short: "Sun" },
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

  const handleToggle = (dow: number, checked: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [dow]: {
        ...prev[dow],
        enabled: checked,
        intervals:
          prev[dow].intervals.length === 0
            ? [{ startTime: "09:00", endTime: "17:00" }]
            : prev[dow].intervals,
      },
    }));
  };

  const handleAddInterval = (dow: number) => {
    setSchedule((prev) => {
      const current = prev[dow];
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
        [dow]: {
          ...current,
          intervals: [...current.intervals, { startTime: nextStart, endTime: nextEnd }],
        },
      };
    });
  };

  const handleUpdateInterval = (
    dow: number,
    index: number,
    field: "startTime" | "endTime",
    val: string,
  ) => {
    setSchedule((prev) => {
      const current = prev[dow];
      const nextIntervals = current.intervals.map((inv, i) =>
        i === index ? { ...inv, [field]: val } : inv,
      );
      return {
        ...prev,
        [dow]: {
          ...current,
          intervals: nextIntervals,
        },
      };
    });
  };

  const handleRemoveInterval = (dow: number, index: number) => {
    setSchedule((prev) => {
      const current = prev[dow];
      const nextIntervals = current.intervals.filter((_, i) => i !== index);
      return {
        ...prev,
        [dow]: {
          ...current,
          intervals: nextIntervals,
        },
      };
    });
  };

  const handleSave = async () => {
    // Validate enabled intervals
    for (const d of DAYS) {
      const day = schedule[d.dow];
      if (day.enabled) {
        if (day.intervals.length === 0) {
          toast.error(`${d.label}: Please add at least one interval or disable the day.`);
          return;
        }
        for (let i = 0; i < day.intervals.length; i++) {
          const inv = day.intervals[i];
          if (!inv.startTime || !inv.endTime || inv.startTime >= inv.endTime) {
            toast.error(`${d.label} slot ${i + 1}: Start time must be before end time.`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="font-heading text-lg font-black text-foreground">
              Edit Weekly Routine
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure your recurring schedule. These hours will repeat automatically every week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {DAYS.map((day) => {
            const current = schedule[day.dow];
            const isFocused = focusedWeekday === day.dow;

            return (
              <div
                key={day.dow}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  isFocused
                    ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                    : current.enabled
                      ? "border-border/80 bg-card hover:border-border"
                      : "border-border/40 bg-muted/10 opacity-75",
                )}
              >
                {/* Day Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={current.enabled}
                      onCheckedChange={(checked) => handleToggle(day.dow, checked)}
                      className="data-[state=checked]:bg-[#0B3B36]"
                    />
                    <span className="font-heading font-black text-sm text-foreground">
                      {day.label}
                    </span>
                    {current.enabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                        Working Day
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/40 text-muted-foreground">
                        Day Off
                      </span>
                    )}
                  </div>

                  {current.enabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddInterval(day.dow)}
                      className="h-7.5 gap-1 rounded-xl px-2.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100"
                    >
                      <Plus className="size-3" /> Add Slot
                    </Button>
                  )}
                </div>

                {/* Day Intervals */}
                {current.enabled ? (
                  <div className="mt-3 space-y-2">
                    {current.intervals.map((inv, idx) => {
                      const duration = getSlotDuration(inv.startTime, inv.endTime);

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-2xl border border-border/80 bg-muted/20 p-2.5"
                        >
                          <div className="flex-1">
                            <ModernTimePicker
                              value={inv.startTime}
                              onChange={(val) =>
                                handleUpdateInterval(day.dow, idx, "startTime", val)
                              }
                              align="left"
                            />
                          </div>

                          <span className="text-muted-foreground font-black text-xs px-0.5">–</span>

                          <div className="flex-1">
                            <ModernTimePicker
                              value={inv.endTime}
                              onChange={(val) =>
                                handleUpdateInterval(day.dow, idx, "endTime", val)
                              }
                              align="right"
                            />
                          </div>

                          {duration && (
                            <span className="hidden sm:inline-block text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                              {duration}
                            </span>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveInterval(day.dow, idx)}
                            disabled={current.intervals.length <= 1}
                            className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            title="Remove interval"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground font-medium pl-11">
                    Day off (No appointments offered)
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t border-border/60 pt-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-2xl px-4 text-xs font-bold border-border/80"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 gap-2 rounded-2xl px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#075e5a] text-white shadow-md shadow-[#0B3B36]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
