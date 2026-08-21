"use client";

import * as React from "react";
import { Edit3, Info, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayAvailability } from "@/types/availability";
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
  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-4 transition-all">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-heading font-black text-base sm:text-lg text-foreground flex items-center gap-2">
              Weekly Routine
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isReadOnly
                ? "Regular weekly working hours for this practitioner."
                : "Your regular recurring working schedule."}
            </p>
          </div>

          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenEditor()}
              className="h-8.5 gap-1.5 rounded-2xl px-3.5 text-xs font-black border-border/80 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-all shadow-2xs"
            >
              <Edit3 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Edit Routine
            </Button>
          )}
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {DAYS.map((day) => {
            const rule = weeklyMap[day.dow];
            const isEnabled = rule?.enabled && rule.intervals.length > 0;

            return (
              <div
                key={day.dow}
                className={cn(
                  "rounded-2xl border p-3.5 flex flex-col justify-between min-h-[175px] transition-all hover:scale-[1.01]",
                  isEnabled
                    ? "border-border/80 bg-card hover:border-emerald-300/80 shadow-2xs"
                    : "border-dashed border-border/60 bg-muted/10 opacity-80",
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span
                    className={cn(
                      "font-heading font-black text-xs",
                      day.isWeekend
                        ? "text-teal-800 dark:text-teal-400"
                        : "text-foreground",
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isEnabled
                        ? "bg-emerald-500 shadow-2xs shadow-emerald-500/50"
                        : "bg-muted-foreground/30",
                    )}
                  />
                </div>

                {/* Body: Intervals */}
                <div className="space-y-1.5 my-2 flex-1 flex flex-col justify-center">
                  {isEnabled ? (
                    rule.intervals.map((inv, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/40 px-2 py-1.5 text-center text-[11px] font-black tabular-nums text-emerald-950 dark:text-emerald-200 tracking-tight shadow-2xs"
                      >
                        {inv.startTime} – {inv.endTime}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-3 text-center text-[11px] font-bold text-muted-foreground/70">
                      Day off
                    </div>
                  )}
                </div>

                {/* Footer Action (Dentist Only) */}
                {!isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => onOpenEditor(day.dow)}
                    className="w-full text-center py-1 text-[10px] font-black text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-2.5" /> Adjust
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
            <strong>Tip:</strong> Click any date in the calendar above to customize hours or mark leave for that specific day.
          </span>
        </div>
      )}
    </div>
  );
}
