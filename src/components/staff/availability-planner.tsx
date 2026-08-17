"use client";

import * as React from "react";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarOff,
  Check,
  Clock,
  Copy,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveMultiIntervalWeeklyAvailability,
  setAvailabilityExceptionAction,
  deleteAvailabilityExceptionAction,
} from "@/lib/server/appointments";
import { computeUpcoming10DaysAvailability } from "@/lib/availability";
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  DayAvailability,
  UpcomingDayAvailability,
} from "@/types/availability";
import { cn } from "@/lib/utils";

const DAYS = [
  { index: 1, short: "Mon", label: "Monday" },
  { index: 2, short: "Tue", label: "Tuesday" },
  { index: 3, short: "Wed", label: "Wednesday" },
  { index: 4, short: "Thu", label: "Thursday" },
  { index: 5, short: "Fri", label: "Friday" },
  { index: 6, short: "Sat", label: "Saturday" },
  { index: 0, short: "Sun", label: "Sunday" },
] as const;

interface Props {
  practitionerId: string;
  rules: AvailabilityRuleRow[];
  exceptions?: AvailabilityExceptionRow[];
}

export function AvailabilityPlanner({
  practitionerId,
  rules,
  exceptions = [],
}: Props) {
  // Initialize multi-interval state from database rules
  const initialDays: DayAvailability[] = React.useMemo(() => {
    return DAYS.map((day) => {
      const dayRules = rules.filter((r) => r.day_of_week === day.index);
      if (dayRules.length > 0) {
        return {
          dayOfWeek: day.index,
          enabled: true,
          intervals: dayRules.map((r) => ({
            id: r.id,
            startTime: r.start_time.slice(0, 5),
            endTime: r.end_time.slice(0, 5),
          })),
        };
      }
      return {
        dayOfWeek: day.index,
        enabled: false,
        intervals: [],
      };
    });
  }, [rules]);

  const [week, setWeek] = React.useState<DayAvailability[]>(initialDays);
  const [activeExceptions, setActiveExceptions] = React.useState<AvailabilityExceptionRow[]>(exceptions);
  const [isSaving, setIsSaving] = React.useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = React.useState(false);
  const [targetExceptionDate, setTargetExceptionDate] = React.useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = React.useState("");
  const [exceptionSaving, setExceptionSaving] = React.useState(false);

  // Compute validation errors per day
  const dayValidationErrors = React.useMemo(() => {
    const errors: Record<number, string | null> = {};

    for (const day of week) {
      if (!day.enabled) {
        errors[day.dayOfWeek] = null;
        continue;
      }

      if (day.intervals.length === 0) {
        errors[day.dayOfWeek] = "Add at least one time interval or disable this day.";
        continue;
      }

      // Check each interval format and start < end
      let hasInvalidInterval = false;
      for (const interval of day.intervals) {
        if (!/^\d{2}:\d{2}$/.test(interval.startTime) || !/^\d{2}:\d{2}$/.test(interval.endTime)) {
          errors[day.dayOfWeek] = "Invalid time format (HH:mm required).";
          hasInvalidInterval = true;
          break;
        }
        if (interval.startTime >= interval.endTime) {
          errors[day.dayOfWeek] = `Start time (${interval.startTime}) must be before end time (${interval.endTime}).`;
          hasInvalidInterval = true;
          break;
        }
      }
      if (hasInvalidInterval) continue;

      // Check for overlapping intervals
      const sorted = [...day.intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
      let hasOverlap = false;
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].endTime > sorted[i + 1].startTime) {
          errors[day.dayOfWeek] = `Intervals overlap: ${sorted[i].startTime}–${sorted[i].endTime} and ${sorted[i + 1].startTime}–${sorted[i + 1].endTime}.`;
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) continue;

      errors[day.dayOfWeek] = null;
    }

    return errors;
  }, [week]);

  const hasAnyErrors = Object.values(dayValidationErrors).some((err) => err !== null);

  // Toggle day enabled/disabled
  const handleToggleDay = (dayOfWeek: number, enabled: boolean) => {
    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          return {
            ...d,
            enabled,
            intervals:
              enabled && d.intervals.length === 0
                ? [{ startTime: "09:00", endTime: "17:00" }]
                : d.intervals,
          };
        }
        return d;
      }),
    );
  };

  // Add new interval to a day
  const handleAddInterval = (dayOfWeek: number) => {
    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          // Compute a smart default for the next interval
          let nextStart = "14:00";
          let nextEnd = "18:00";

          if (d.intervals.length > 0) {
            const lastInterval = d.intervals[d.intervals.length - 1];
            const [lastEndHour] = lastInterval.endTime.split(":").map(Number);
            if (!isNaN(lastEndHour) && lastEndHour < 22) {
              const startH = Math.min(22, lastEndHour + 1);
              const endH = Math.min(23, startH + 4);
              nextStart = `${String(startH).padStart(2, "0")}:00`;
              nextEnd = `${String(endH).padStart(2, "0")}:00`;
            }
          }

          return {
            ...d,
            enabled: true,
            intervals: [...d.intervals, { startTime: nextStart, endTime: nextEnd }],
          };
        }
        return d;
      }),
    );
  };

  // Remove interval from a day
  const handleRemoveInterval = (dayOfWeek: number, index: number) => {
    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          const updated = d.intervals.filter((_, i) => i !== index);
          return {
            ...d,
            intervals: updated,
            enabled: updated.length > 0,
          };
        }
        return d;
      }),
    );
  };

  // Update interval time
  const handleUpdateInterval = (
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          const updated = [...d.intervals];
          updated[index] = { ...updated[index], [field]: value };
          return { ...d, intervals: updated };
        }
        return d;
      }),
    );
  };

  // Copy Monday schedule to all weekdays (Mon-Fri)
  const handleCopyMonToWeekdays = () => {
    const mon = week.find((d) => d.dayOfWeek === 1);
    if (!mon) return;

    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) {
          return {
            ...d,
            enabled: mon.enabled,
            intervals: mon.intervals.map((inv) => ({ ...inv })),
          };
        }
        return d;
      }),
    );
    toast.info("Copied Monday's hours to Monday through Friday.");
  };

  // Save weekly availability
  const handleSaveWeekly = async () => {
    if (hasAnyErrors) {
      toast.error("Please resolve the scheduling errors before saving.");
      return;
    }

    setIsSaving(true);
    const result = await saveMultiIntervalWeeklyAvailability({
      practitionerId,
      days: week,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Weekly availability schedule saved successfully");
    }
  };

  // Compute upcoming 10 days
  const upcoming10Days: UpcomingDayAvailability[] = React.useMemo(() => {
    // Generate synthetic rules from current week state
    const currentRules: AvailabilityRuleRow[] = [];
    for (const d of week) {
      if (!d.enabled) continue;
      for (const inv of d.intervals) {
        currentRules.push({
          id: inv.id ?? `temp-${d.dayOfWeek}-${inv.startTime}`,
          practitioner_id: practitionerId,
          branch_id: "",
          day_of_week: d.dayOfWeek,
          start_time: inv.startTime,
          end_time: inv.endTime,
          effective_from: "2020-01-01",
          effective_to: null,
        });
      }
    }

    return computeUpcoming10DaysAvailability(currentRules, activeExceptions);
  }, [week, activeExceptions, practitionerId]);

  // Open exception modal
  const handleOpenExceptionDialog = (dateStr: string) => {
    setTargetExceptionDate(dateStr);
    setExceptionReason("");
    setExceptionDialogOpen(true);
  };

  // Save exception
  const handleSaveException = async () => {
    if (!targetExceptionDate) return;
    setExceptionSaving(true);

    const res = await setAvailabilityExceptionAction({
      practitionerId,
      date: targetExceptionDate,
      isUnavailable: true,
      reason: exceptionReason.trim() || "Planned leave",
    });

    setExceptionSaving(false);
    if (res.success) {
      setActiveExceptions((prev) => [
        ...prev.filter((e) => e.date !== targetExceptionDate),
        {
          id: `temp-${Date.now()}`,
          practitioner_id: practitionerId,
          date: targetExceptionDate,
          start_time: null,
          end_time: null,
          is_unavailable: true,
          reason: exceptionReason.trim() || "Planned leave",
        },
      ]);
      setExceptionDialogOpen(false);
      toast.success(`Marked ${targetExceptionDate} as unavailable`);
    } else {
      toast.error(res.error ?? "Failed to mark date exception");
    }
  };

  // Remove exception
  const handleRemoveException = async (exceptionId: string, dateStr: string) => {
    const res = await deleteAvailabilityExceptionAction({
      practitionerId,
      exceptionId,
    });

    if (res.success) {
      setActiveExceptions((prev) => prev.filter((e) => e.id !== exceptionId && e.date !== dateStr));
      toast.success(`Restored regular schedule for ${dateStr}`);
    } else {
      toast.error(res.error ?? "Failed to restore regular schedule");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_52px_-44px_rgba(9,47,44,0.6)]">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-[18px] text-primary" />
            <h2 className="font-heading text-lg font-extrabold">Availability Planner</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure working intervals per weekday and view upcoming effective availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleSaveWeekly}
            disabled={isSaving || hasAnyErrors}
            size="lg"
            className="h-10 gap-2 rounded-xl px-5 font-bold shadow-md shadow-primary/15"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save schedule
          </Button>
        </div>
      </div>

      {/* 2. Tabs: Weekly Schedule vs Next 10 Days */}
      <Tabs defaultValue="weekly" className="w-full">
        <div className="border-b border-border bg-muted/20 px-5 py-2.5 sm:px-6">
          <TabsList className="h-10 rounded-xl bg-muted/80 p-1">
            <TabsTrigger value="weekly" className="gap-2 rounded-lg px-4 text-xs font-bold">
              <Calendar className="size-3.5" />
              Weekly Schedule (Recurring)
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2 rounded-lg px-4 text-xs font-bold">
              <CalendarCheck className="size-3.5" />
              Next 10 Calendar Days
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Weekly Schedule Editor */}
        <TabsContent value="weekly" className="m-0 p-5 sm:p-6">
          {/* Quick preset toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background-subtle/50 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              <span>Recurring weekly template:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyMonToWeekdays}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <Copy className="size-3.5" />
                Copy Mon to all weekdays
              </Button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS.map((day) => {
              const dayState = week.find((d) => d.dayOfWeek === day.index)!;
              const error = dayValidationErrors[day.index];

              return (
                <div
                  key={day.index}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-4 transition-all",
                    dayState.enabled
                      ? "border-border bg-surface shadow-sm"
                      : "border-dashed border-border/80 bg-muted/30 opacity-80",
                    error && "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/30",
                  )}
                >
                  {/* Top Bar: Day label & Toggle */}
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-border/70">
                      <div>
                        <p className="font-heading text-sm font-extrabold text-foreground">
                          {day.label}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Recurring weekly
                        </p>
                      </div>

                      <Switch
                        id={`switch-day-${day.index}`}
                        checked={dayState.enabled}
                        onCheckedChange={(checked) => handleToggleDay(day.index, checked)}
                      />
                    </div>

                    {/* Intervals List */}
                    {dayState.enabled ? (
                      <div className="mt-4 space-y-3">
                        {dayState.intervals.map((interval, idx) => (
                          <div
                            key={idx}
                            className="group relative flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5 shadow-2xs transition-colors hover:border-primary/40"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Start time</span>
                                <span>End time</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={interval.startTime}
                                  onChange={(e) =>
                                    handleUpdateInterval(day.index, idx, "startTime", e.target.value)
                                  }
                                  className="h-8 flex-1 min-w-[76px] rounded-lg border border-border bg-surface px-2 text-center text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-xs font-bold text-muted-foreground">→</span>
                                <input
                                  type="time"
                                  value={interval.endTime}
                                  onChange={(e) =>
                                    handleUpdateInterval(day.index, idx, "endTime", e.target.value)
                                  }
                                  className="h-8 flex-1 min-w-[76px] rounded-lg border border-border bg-surface px-2 text-center text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                            </div>

                            {dayState.intervals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveInterval(day.index, idx)}
                                title="Remove interval"
                                className="mt-3.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Add Interval Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddInterval(day.index)}
                          className="h-8 w-full gap-1.5 rounded-xl border-dashed text-xs font-bold text-primary hover:bg-primary-soft hover:text-primary"
                        >
                          <Plus className="size-3.5" />
                          Add interval
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                        <CalendarOff className="size-6 text-muted-foreground/50" />
                        <span className="mt-2 text-xs font-semibold text-muted-foreground">
                          Not available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inline Error Message */}
                  {error && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2.5 text-[11px] font-semibold text-destructive leading-tight">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Next 10 Days Effective Availability */}
        <TabsContent value="upcoming" className="m-0 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-extrabold text-foreground">
                Next 10 Calendar Days Overview
              </h3>
              <p className="text-xs text-muted-foreground">
                Effective working schedule calculated from your recurring weekly template and date-specific exceptions/leave.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {upcoming10Days.map((day) => {
              const hasException = !!day.exception;
              const datePart = day.dayShort.includes(", ") ? day.dayShort.split(", ")[1] : day.dayShort;

              return (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-xs",
                    day.isToday && "ring-2 ring-primary/40",
                    day.isAvailable
                      ? "border-border bg-surface"
                      : "border-border/70 bg-muted/20 opacity-80",
                    hasException && "border-warning/50 bg-warning/5",
                  )}
                >
                  <div>
                    {/* Header: Weekday & Actual Calendar Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading text-sm font-extrabold text-foreground">
                          {day.dayName}
                        </p>
                        <p className="text-xs font-bold text-primary">
                          {datePart}
                        </p>
                      </div>

                      {day.isToday && (
                        <Badge className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-extrabold text-primary-foreground">
                          Today
                        </Badge>
                      )}
                    </div>

                    {/* Working Intervals or Status */}
                    <div className="mt-3">
                      {day.isAvailable && day.intervals.length > 0 ? (
                        <div className="space-y-1.5">
                          {day.intervals.map((inv, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 rounded-lg bg-primary-soft/60 px-2.5 py-1 text-xs font-bold text-primary dark:bg-primary-soft/40"
                            >
                              <Clock className="size-3 text-primary" />
                              <span>
                                {inv.startTime} – {inv.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center text-xs font-semibold text-muted-foreground">
                          {day.statusLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exception Action Button */}
                  <div className="mt-4 pt-2.5 border-t border-border/60">
                    {hasException ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveException(day.exception!.id, day.date)}
                        className="h-7 w-full gap-1 rounded-lg text-[10px] font-bold text-destructive hover:bg-destructive/10"
                      >
                        <X className="size-3" />
                        Remove leave
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenExceptionDialog(day.date)}
                        className="h-7 w-full gap-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <CalendarOff className="size-3" />
                        Mark as leave
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* 3. Safety Notice Banner */}
      <div className="flex items-start gap-3 border-t border-border bg-background-subtle/40 p-4 sm:px-6">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">Appointment Safety Guarantee:</strong> Adjusting your working intervals or marking leave applies to new appointment slots only. Any existing visits already booked on your clinical diary remain intact and will not be moved or cancelled.
        </p>
      </div>

      {/* 4. Date Exception Dialog */}
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <CalendarOff className="size-5 text-warning" />
              Mark Date Unavailable
            </DialogTitle>
            <DialogDescription>
              Mark {targetExceptionDate} as unavailable on your calendar. New patient and staff booking slots will be blocked for this entire date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exception-reason" className="text-xs font-bold">
                Reason (optional):
              </Label>
              <Input
                id="exception-reason"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="e.g. Vacation, Annual Dental Conference, Personal leave"
                className="h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExceptionDialogOpen(false)}
              disabled={exceptionSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveException}
              disabled={exceptionSaving}
              className="gap-2 font-bold"
            >
              {exceptionSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Confirm leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
