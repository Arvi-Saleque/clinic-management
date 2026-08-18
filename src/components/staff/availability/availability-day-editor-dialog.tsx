"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck2,
  CalendarOff,
  CalendarRange,
  Check,
  Clock,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  saveDayAvailabilityOverrideAction,
  resetDayAvailabilityOverrideAction,
  getAppointmentsForDate,
} from "@/lib/server/appointments";
import type { CalendarDayAvailability, TimeInterval } from "@/types/availability";
import { saveDateOverrideSchema } from "@/lib/validation/availability";
import { cn } from "@/lib/utils";

interface AvailabilityDayEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDayAvailability | null;
  practitionerId: string;
  onSuccess: () => void;
  onEditRecurringWeekday?: (dayOfWeek: number) => void;
}

interface AppointmentTiming {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  patientName: string;
}

export function AvailabilityDayEditorDialog({
  isOpen,
  onClose,
  day,
  practitionerId,
  onSuccess,
  onEditRecurringWeekday,
}: AvailabilityDayEditorDialogProps) {
  if (!day) return null;

  return (
    <AvailabilityDayEditorDialogContent
      key={day.date}
      isOpen={isOpen}
      onClose={onClose}
      day={day}
      practitionerId={practitionerId}
      onSuccess={onSuccess}
      onEditRecurringWeekday={onEditRecurringWeekday}
    />
  );
}

function AvailabilityDayEditorDialogContent({
  isOpen,
  onClose,
  day,
  practitionerId,
  onSuccess,
  onEditRecurringWeekday,
}: {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDayAvailability;
  practitionerId: string;
  onSuccess: () => void;
  onEditRecurringWeekday?: (dayOfWeek: number) => void;
}) {
  const isFullDayLeave = day.source === "full_day_leave";
  const isCustomOverride = day.source === "date_override";
  const isNotScheduled = day.source === "not_scheduled";
  const hasExistingOverride = isCustomOverride || isFullDayLeave;

  const [isUnavailable, setIsUnavailable] = React.useState<boolean>(isFullDayLeave);
  const [leaveReason, setLeaveReason] = React.useState<string>(day.leaveReason || "");
  const [intervals, setIntervals] = React.useState<TimeInterval[]>(() => {
    if (day.intervals.length > 0) return [...day.intervals];
    return [];
  });
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  // Active appointments on this date for conflict detection
  const [dayAppointments, setDayAppointments] = React.useState<AppointmentTiming[]>([]);

  // Load active appointments for conflict detection
  React.useEffect(() => {
    let isMounted = true;
    getAppointmentsForDate(practitionerId, day.date)
      .then((appts) => {
        if (isMounted) setDayAppointments(appts);
      })
      .catch((err) => {
        console.error("Failed to load date appointments:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [day.date, practitionerId]);

  const dateObj = parseISO(day.date);
  const formattedDate = format(dateObj, "EEEE, d MMMM yyyy");
  const weekdayName = format(dateObj, "EEEE");
  const appointmentCount = day.activeAppointmentCount ?? dayAppointments.length;

  // Conflict Detection: Calculate if any booked appointments fall outside proposed intervals
  const conflictingAppointments = React.useMemo(() => {
    if (dayAppointments.length > 0) {
      if (isUnavailable) {
        return dayAppointments;
      }

      if (intervals.length === 0) {
        return dayAppointments;
      }

      return dayAppointments.filter((appt) => {
        const isContained = intervals.some((inv) => {
          return appt.startTime >= inv.startTime && appt.endTime <= inv.endTime;
        });
        return !isContained;
      });
    }

    if (appointmentCount > 0 && (isUnavailable || intervals.length === 0)) {
      return [
        {
          id: "active-booked",
          startTime: "Scheduled",
          endTime: "Visits",
          status: "confirmed",
          patientName: `${appointmentCount} booked patient ${appointmentCount === 1 ? "visit" : "visits"}`,
        },
      ];
    }

    return [];
  }, [dayAppointments, intervals, isUnavailable, appointmentCount]);

  const handleAddInterval = () => {
    setValidationError(null);
    let newStart = "09:00";
    let newEnd = "13:00";

    if (intervals.length > 0) {
      const last = intervals[intervals.length - 1];
      const [h, m] = last.endTime.split(":").map(Number);
      const startH = Math.min(h + 1, 22);
      const endH = Math.min(startH + 4, 23);
      newStart = `${String(startH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      newEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    setIntervals((prev) => [...prev, { startTime: newStart, endTime: newEnd }]);
  };

  const handleUpdateInterval = (index: number, field: keyof TimeInterval, val: string) => {
    setValidationError(null);
    setIntervals((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleDeleteInterval = (index: number) => {
    setValidationError(null);
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setValidationError(null);

    if (isUnavailable) {
      setIsSaving(true);
      try {
        const result = await saveDayAvailabilityOverrideAction({
          practitionerId,
          date: day.date,
          isUnavailable: true,
          reason: leaveReason.trim() || undefined,
          intervals: [],
        });

        if (result.error) {
          setValidationError(result.error);
          return;
        }

        toast.success(`Leave scheduled for ${formattedDate}`);
        onSuccess();
        onClose();
      } catch (err: unknown) {
        setValidationError(err instanceof Error ? err.message : "Unexpected error saving leave.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Working intervals validation
    if (intervals.length === 0) {
      setValidationError("Please add at least one working shift or choose 'On Leave / Unavailable'.");
      return;
    }

    const payload = {
      practitionerId,
      date: day.date,
      isUnavailable: false,
      leaveReason: undefined,
      intervals,
    };

    const parsed = saveDateOverrideSchema.safeParse(payload);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid working hours configuration.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveDayAvailabilityOverrideAction(payload);
      if (result.error) {
        setValidationError(result.error);
        return;
      }

      toast.success(`Custom hours saved for ${formattedDate}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Unexpected error saving schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setValidationError(null);
    setIsResetting(true);
    try {
      const result = await resetDayAvailabilityOverrideAction({
        practitionerId,
        date: day.date,
      });

      if (result.error) {
        setValidationError(result.error);
        return;
      }

      toast.success(`Reset ${formattedDate} to normal ${weekdayName} hours`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Unexpected error resetting date.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleEditRecurringShortcut = () => {
    onClose();
    if (onEditRecurringWeekday) {
      onEditRecurringWeekday(day.dayOfWeek);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {formattedDate}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Adjust working hours or schedule planned leave for this specific date only.
          </DialogDescription>
        </DialogHeader>

        {/* Schedule Source Status Bar */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Current Schedule:</span>
            {isUnavailable || isFullDayLeave ? (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-medium"
              >
                <CalendarOff className="w-3 h-3 mr-1" />
                On Leave — This Date Only
              </Badge>
            ) : isCustomOverride ? (
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-xs font-medium"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Adjusted Hours — This Date Only
              </Badge>
            ) : isNotScheduled ? (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border/80 text-xs font-medium"
              >
                <Clock className="w-3 h-3 mr-1" />
                Normal {weekdayName} Routine: Off
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-medium"
              >
                <CalendarCheck2 className="w-3 h-3 mr-1" />
                Regular {weekdayName} Hours
              </Badge>
            )}
          </div>

          {appointmentCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
            >
              <Users className="w-3 h-3 mr-1" />
              {appointmentCount} {appointmentCount === 1 ? "appointment" : "appointments"}
            </Badge>
          )}
        </div>

        {/* Doctor Scope & Decision Cue Banner */}
        <div className="p-3 rounded-xl bg-primary/[0.04] border border-primary/15 text-xs text-muted-foreground space-y-2.5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {isUnavailable ? (
                <span>
                  Your regular {weekdayName} routine remains unchanged for future weeks.
                </span>
              ) : isCustomOverride ? (
                <span>
                  This date differs from your regular {weekdayName} routine. Changes saved here affect only this date.
                </span>
              ) : isNotScheduled ? (
                <span>
                  This day is normally off in your weekly routine.
                </span>
              ) : (
                <span>
                  These are your regular {weekdayName} working hours.
                </span>
              )}
            </div>
          </div>

          {/* Quick Choice / Decision Cue for Changing Recurring Weekday */}
          {onEditRecurringWeekday && (
            <div className="pt-2 border-t border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-foreground/80">
                Changing your schedule?
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEditRecurringShortcut}
                  className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <CalendarRange className="w-3 h-3" />
                  {isNotScheduled ? `Make ${weekdayName}s a Working Day` : `Change every ${weekdayName}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Working Status Toggle */}
        <div className="space-y-3 pt-1">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Schedule for this date
          </Label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setIsUnavailable(false);
                setValidationError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
                !isUnavailable
                  ? "bg-background text-foreground shadow-xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Available for Bookings
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUnavailable(true);
                setValidationError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
                isUnavailable
                  ? "bg-background text-foreground shadow-xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              On Leave / Unavailable
            </button>
          </div>
        </div>

        {/* Mode-Specific Controls */}
        {!isUnavailable ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Working Hours
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Changes saved here apply only to {formattedDate}.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddInterval}
                className="h-7 text-xs font-semibold gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" />
                Add Shift
              </Button>
            </div>

            {intervals.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center space-y-2 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {isNotScheduled
                    ? `This day is normally off in your weekly routine. Add working hours below to open bookings for this specific date.`
                    : "No working intervals configured. Click 'Add Working Hours' to define hours for this date."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInterval}
                  className="h-7 text-xs font-semibold gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Hours for This {weekdayName}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {intervals.map((inv, idx) => (
                  <div
                    key={`inv-${idx}`}
                    className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/70 shadow-xs"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Start Time
                        </span>
                        <Input
                          type="time"
                          value={inv.startTime}
                          onChange={(e) => handleUpdateInterval(idx, "startTime", e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          End Time
                        </span>
                        <Input
                          type="time"
                          value={inv.endTime}
                          onChange={(e) => handleUpdateInterval(idx, "endTime", e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInterval(idx)}
                      disabled={intervals.length === 1 && !isNotScheduled}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 mt-3"
                      title="Remove interval"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <Label htmlFor="leave-reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reason / Leave Note (Optional)
            </Label>
            <Input
              id="leave-reason"
              placeholder="e.g. Annual dental conference, Personal leave, Clinic closed"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              This note helps practice staff and scheduling administrators understand the reason for unavailability.
            </p>
          </div>
        )}

        {/* Appointment Safety Guarantee Callout */}
        <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Appointment Safety Guarantee:</strong> Availability
            changes adjust future patient booking slots only. Any existing booked visits remain
            100% active on your clinical calendar.
          </div>
        </div>

        {/* Appointment Conflict Warning (Non-Destructive Alert) */}
        {conflictingAppointments.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold block">
                {conflictingAppointments.length === 1
                  ? "1 existing appointment falls outside these proposed working hours."
                  : `${conflictingAppointments.length} existing appointments fall outside these proposed working hours.`}
              </strong>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                These appointments will <strong>remain booked</strong> in your diary. Please review
                your clinical schedule if patient rescheduling is needed.
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5">
                {conflictingAppointments.map((appt) => (
                  <span
                    key={appt.id}
                    className="inline-flex items-center text-[10px] font-semibold bg-amber-500/20 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-md"
                  >
                    {appt.startTime && appt.endTime ? `${appt.startTime}–${appt.endTime}` : ""} ({appt.patientName})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/60">
          <div>
            {hasExistingOverride && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isSaving || isResetting}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
              >
                {isResetting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Reset to Regular {weekdayName} Hours
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving || isResetting}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {isUnavailable ? "Confirm Leave" : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
