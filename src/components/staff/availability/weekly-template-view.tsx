"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Copy,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { saveMultiIntervalWeeklyAvailability } from "@/lib/server/appointments";
import type { DayAvailability, TimeInterval } from "@/types/availability";
import { saveMultiIntervalAvailabilitySchema } from "@/lib/validation/availability";
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

interface WeeklyTemplateViewProps {
  branchId?: string;
  practitionerId: string;
  initialRules: Record<number, DayAvailability>;
  focusedWeekday?: number | null;
  onSuccess: () => void;
  onViewScheduleOverview?: () => void;
}

export function WeeklyTemplateView({
  practitionerId,
  initialRules,
  focusedWeekday = null,
  onSuccess,
  onViewScheduleOverview,
}: WeeklyTemplateViewProps) {
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

  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Scroll to focused weekday if supplied from day editor shortcut
  React.useEffect(() => {
    if (focusedWeekday !== null && focusedWeekday !== undefined) {
      const el = document.getElementById(`weekday-card-${focusedWeekday}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [focusedWeekday]);

  const handleToggle = (dow: number, checked: boolean) => {
    setValidationError(null);
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
    setValidationError(null);
    setSchedule((prev) => {
      const currentIntervals = prev[dow]?.intervals ?? [];
      let newStart = "14:00";
      let newEnd = "18:00";

      if (currentIntervals.length > 0) {
        const last = currentIntervals[currentIntervals.length - 1];
        const [h, m] = last.endTime.split(":").map(Number);
        const startH = Math.min(h + 1, 22);
        const endH = Math.min(startH + 4, 23);
        newStart = `${String(startH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        newEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }

      return {
        ...prev,
        [dow]: {
          ...prev[dow],
          intervals: [...currentIntervals, { startTime: newStart, endTime: newEnd }],
        },
      };
    });
  };

  const handleUpdateInterval = (
    dow: number,
    index: number,
    field: keyof TimeInterval,
    val: string,
  ) => {
    setValidationError(null);
    setSchedule((prev) => {
      const day = prev[dow];
      if (!day) return prev;
      const updatedIntervals = [...day.intervals];
      updatedIntervals[index] = { ...updatedIntervals[index], [field]: val };
      return {
        ...prev,
        [dow]: {
          ...day,
          intervals: updatedIntervals,
        },
      };
    });
  };

  const handleDeleteInterval = (dow: number, index: number) => {
    setValidationError(null);
    setSchedule((prev) => {
      const day = prev[dow];
      if (!day) return prev;
      const updatedIntervals = day.intervals.filter((_, i) => i !== index);
      return {
        ...prev,
        [dow]: {
          ...day,
          intervals: updatedIntervals,
        },
      };
    });
  };

  const handleCopyMonday = () => {
    setValidationError(null);
    const mon = schedule[1];
    if (!mon) return;
    setSchedule((prev) => ({
      ...prev,
      2: { dayOfWeek: 2, enabled: mon.enabled, intervals: [...mon.intervals] },
      3: { dayOfWeek: 3, enabled: mon.enabled, intervals: [...mon.intervals] },
      4: { dayOfWeek: 4, enabled: mon.enabled, intervals: [...mon.intervals] },
      5: { dayOfWeek: 5, enabled: mon.enabled, intervals: [...mon.intervals] },
    }));
    toast.info("Copied Monday hours to Tuesday–Friday");
  };

  const handleSave = async () => {
    setValidationError(null);

    const payload = {
      practitionerId,
      days: Object.values(schedule).map((day) => ({
        dayOfWeek: day.dayOfWeek,
        enabled: day.enabled,
        intervals: day.enabled ? day.intervals : [],
      })),
    };

    const parsed = saveMultiIntervalAvailabilitySchema.safeParse(payload);
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Invalid weekly working hours configuration.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveMultiIntervalWeeklyAvailability(payload);
      if (result.error) {
        setValidationError(result.error);
        return;
      }
      toast.success("Weekly working hours saved successfully");
      onSuccess();
    } catch (err: unknown) {
      setValidationError(
        err instanceof Error ? err.message : "Unexpected error saving weekly working hours.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Weekday Cards */}
      <div className="space-y-2.5">
        {DAYS.map(({ dow, label }) => {
          const day = schedule[dow];
          const isAvail = day?.enabled ?? false;
          const intervals = day?.intervals ?? [];
          const isTargeted = focusedWeekday === dow;

          return (
            <div
              id={`weekday-card-${dow}`}
              key={dow}
              className={cn(
                "p-3.5 rounded-xl bg-card border transition-all duration-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                isTargeted
                  ? "border-primary ring-2 ring-primary/30 bg-primary/[0.03]"
                  : "border-border/70",
              )}
            >
              {/* Day Name & Toggle */}
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-48 shrink-0">
                <Switch
                  id={`switch-${dow}`}
                  checked={isAvail}
                  onCheckedChange={(c) => handleToggle(dow, c)}
                />
                <label
                  htmlFor={`switch-${dow}`}
                  className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-2"
                >
                  {label}
                  {isTargeted && (
                    <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                      Selected
                    </span>
                  )}
                </label>
              </div>

              {/* Intervals */}
              <div className="flex-1 flex flex-col gap-2">
                {isAvail ? (
                  intervals.map((inv, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
                      <Input
                        type="time"
                        value={inv.startTime}
                        onChange={(e) =>
                          handleUpdateInterval(dow, idx, "startTime", e.target.value)
                        }
                        className="h-8 text-xs w-28 font-mono"
                      />
                      <span className="text-xs text-muted-foreground font-medium">to</span>
                      <Input
                        type="time"
                        value={inv.endTime}
                        onChange={(e) =>
                          handleUpdateInterval(dow, idx, "endTime", e.target.value)
                        }
                        className="h-8 text-xs w-28 font-mono"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInterval(dow, idx)}
                        disabled={intervals.length === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove interval"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Off (No recurring hours)
                  </span>
                )}
              </div>

              {/* Add Interval Action */}
              {isAvail && (
                <div className="flex sm:justify-end shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddInterval(dow)}
                    className="h-7 text-xs font-semibold gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Shift
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Validation Feedback */}
      {validationError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyMonday}
            className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Monday to Tue–Fri
          </Button>

          {onViewScheduleOverview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onViewScheduleOverview}
              className="text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hidden md:inline-flex"
            >
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              View Schedule Overview
            </Button>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save Weekly Working Hours
        </Button>
      </div>
    </div>
  );
}
