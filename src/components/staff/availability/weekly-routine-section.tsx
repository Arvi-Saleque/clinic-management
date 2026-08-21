"use client";

import * as React from "react";
import { Clock, Edit3, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
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
  if (mins === 0) return `${hrs} hrs`;
  return `${hrs}h ${mins}m`;
}

function computeTotalWeeklyHours(weeklyMap: Record<number, DayAvailability>) {
  let totalMin = 0;
  for (const d of DAYS) {
    const day = weeklyMap[d.dow];
    if (day?.enabled && day.intervals) {
      for (const inv of day.intervals) {
        if (inv.startTime && inv.endTime && inv.startTime < inv.endTime) {
          const [sh, sm] = inv.startTime.split(":").map(Number);
          const [eh, em] = inv.endTime.split(":").map(Number);
          totalMin += eh * 60 + em - (sh * 60 + sm);
        }
      }
    }
  }
  if (totalMin <= 0) return "0 hrs / week";
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (mins === 0) return `${hrs} hrs / week`;
  return `${hrs}h ${mins}m / week`;
}

interface WeeklyRoutineSectionProps {
  weeklyMap: Record<number, DayAvailability>;
  onOpenEditor: (dayOfWeek?: number) => void;
  isReadOnly?: boolean;
}

export function WeeklyRoutineSection({
  weeklyMap,
  onOpenEditor,
  isReadOnly = false,
}: WeeklyRoutineSectionProps) {
  const weeklyTotalStr = React.useMemo(
    () => computeTotalWeeklyHours(weeklyMap),
    [weeklyMap],
  );

  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5 transition-all">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading font-black text-lg sm:text-xl text-foreground">
                Weekly Routine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs">
                {weeklyTotalStr}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {isReadOnly
                ? "Regular recurring weekly working hours for this practitioner."
                : "Your regular recurring working schedule that repeats every week."}
            </p>
          </div>

          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenEditor(1)}
              className="h-9 gap-1.5 rounded-2xl px-4 text-xs font-black border-border/80 bg-card hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-all shadow-2xs cursor-pointer"
            >
              <Edit3 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Edit Routine
            </Button>
          )}
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-3.5">
          {DAYS.map((day) => {
            const rule = weeklyMap[day.dow];
            const isEnabled = rule?.enabled && rule.intervals.length > 0;
            const dayHoursStr = isEnabled ? getDayTotalHours(rule.intervals) : null;

            return (
              <div
                key={day.dow}
                className={cn(
                  "group relative rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between min-h-[190px] transition-all duration-200 hover:scale-[1.01]",
                  isEnabled
                    ? "border-border/80 bg-card hover:border-emerald-400/80 hover:shadow-sm"
                    : "border-dashed border-slate-300/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 text-muted-foreground",
                )}
              >
                {/* Day Header Row */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <div>
                    <span
                      className={cn(
                        "font-heading font-black text-sm block",
                        day.isWeekend
                          ? "text-teal-800 dark:text-teal-400"
                          : "text-foreground",
                      )}
                    >
                      {day.label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {day.fullName}
                    </span>
                  </div>

                  {isEnabled ? (
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-500/50" />
                      {dayHoursStr && (
                        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                          {dayHoursStr}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="size-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>

                {/* Body: Intervals */}
                <div className="space-y-1.5 my-3 flex-1 flex flex-col justify-center">
                  {isEnabled ? (
                    rule.intervals.map((inv, idx) => {
                      const duration = getSlotDuration(inv.startTime, inv.endTime);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-1 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/40 px-2.5 py-1.5 text-[11px] font-black tabular-nums text-emerald-950 dark:text-emerald-200 tracking-tight shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">
                              {inv.startTime} – {inv.endTime}
                            </span>
                          </div>
                          {duration && (
                            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 opacity-80 shrink-0">
                              {duration}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-4 text-center text-xs font-bold text-muted-foreground/70">
                      Day off
                    </div>
                  )}
                </div>

                {/* Footer Action - Opens Single-Day Focused Editor */}
                {!isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => onOpenEditor(day.dow)}
                    className="w-full text-center py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <Plus className="size-3" /> Adjust {day.label}
                  </button>
                ) : (
                  <div className="py-1 text-center text-[10px] font-bold text-muted-foreground/70">
                    {isEnabled
                      ? `${rule.intervals.length} ${rule.intervals.length === 1 ? "slot" : "slots"}`
                      : "Off"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Bottom Helper Tip (Dentist Only) */}
      {!isReadOnly && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
          <Info className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] font-medium">
            <strong>Tip:</strong> Click <strong>Adjust</strong> on any day above to quickly edit that day&apos;s routine, or use the calendar above for date-specific changes.
          </span>
        </div>
      )}
    </div>
  );
}
