"use client";

import * as React from "react";
import { Check, Clock, Loader2, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            Edit Weekly Routine
          </DialogTitle>
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
                  "rounded-2xl border p-3.5 transition-all",
                  isFocused
                    ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/20"
                    : "border-border/70 bg-card",
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
                    <span className="font-heading font-bold text-xs text-foreground">
                      {day.label}
                    </span>
                  </div>

                  {current.enabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddInterval(day.dow)}
                      className="h-7 gap-1 rounded-lg px-2 text-[11px] font-bold text-primary hover:bg-primary-soft/30"
                    >
                      <Plus className="size-3" /> Add Slot
                    </Button>
                  )}
                </div>

                {/* Day Intervals */}
                {current.enabled ? (
                  <div className="mt-3 space-y-2">
                    {current.intervals.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/15 p-2"
                      >
                        <div className="relative flex-1">
                          <Clock className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
                          <Input
                            type="time"
                            value={inv.startTime}
                            onChange={(e) =>
                              handleUpdateInterval(day.dow, idx, "startTime", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg pl-8 pr-2 font-bold tabular-nums bg-card border-border/80"
                          />
                        </div>
                        <span className="text-muted-foreground font-bold text-xs">–</span>
                        <div className="relative flex-1">
                          <Input
                            type="time"
                            value={inv.endTime}
                            onChange={(e) =>
                              handleUpdateInterval(day.dow, idx, "endTime", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg px-2 font-bold tabular-nums bg-card border-border/80 text-center"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveInterval(day.dow, idx)}
                          disabled={current.intervals.length <= 1}
                          className="size-7.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Remove interval"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
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

        <DialogFooter className="border-t border-border/50 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 gap-1.5 rounded-xl px-5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Save Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
