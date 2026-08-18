"use client";

import * as React from "react";
import {
  AlertCircle,
  Clock,
  Copy,
  Info,
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

const DAYS = [
  { dow: 1, label: "Monday" },
  { dow: 2, label: "Tuesday" },
  { dow: 3, label: "Wednesday" },
  { dow: 4, label: "Thursday" },
  { dow: 5, label: "Friday" },
  { dow: 6, label: "Saturday" },
  { dow: 0, label: "Sunday" },
];

interface WeeklyTemplateViewProps {
  branchId?: string;
  practitionerId: string;
  initialRules: Record<number, DayAvailability>;
  onSuccess: () => void;
}

export function WeeklyTemplateView({
  practitionerId,
  initialRules,
  onSuccess,
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
    toast.info("Copied Monday template to Tuesday–Friday");
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
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid weekly schedule configuration.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveMultiIntervalWeeklyAvailability(payload);
      if (result.error) {
        setValidationError(result.error);
        return;
      }
      toast.success("Recurring weekly template saved successfully");
      onSuccess();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Unexpected error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Information Banner */}
      <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-foreground font-semibold">Recurring Base Template:</strong> This
          weekly schedule provides your automatic working baseline for all weeks. Any date-specific
          adjustments or planned leave in the <strong>Next 30 Days</strong> view will
          authoritatively override this template without modifying future weeks.
        </div>
      </div>

      {/* Weekday Cards */}
      <div className="space-y-2.5">
        {DAYS.map(({ dow, label }) => {
          const day = schedule[dow];
          const isAvail = day?.enabled ?? false;
          const intervals = day?.intervals ?? [];

          return (
            <div
              key={dow}
              className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                  className="text-sm font-bold text-foreground cursor-pointer"
                >
                  {label}
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
                  <span className="text-xs text-muted-foreground italic">Off (No recurring hours)</span>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyMonday}
          className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Monday to Weekdays (Tue–Fri)
        </Button>

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
          Save Weekly Template
        </Button>
      </div>
    </div>
  );
}
