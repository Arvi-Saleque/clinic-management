"use client";

import { CalendarRange, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayAvailability } from "@/types/availability";

const WEEKDAYS = [
  { dow: 1, shortLabel: "Mon", fullLabel: "Monday" },
  { dow: 2, shortLabel: "Tue", fullLabel: "Tuesday" },
  { dow: 3, shortLabel: "Wed", fullLabel: "Wednesday" },
  { dow: 4, shortLabel: "Thu", fullLabel: "Thursday" },
  { dow: 5, shortLabel: "Fri", fullLabel: "Friday" },
  { dow: 6, shortLabel: "Sat", fullLabel: "Saturday" },
  { dow: 0, shortLabel: "Sun", fullLabel: "Sunday" },
];

interface WeeklyHoursCompactSummaryProps {
  weeklyMap: Record<number, DayAvailability>;
  onEditWeeklyHours: (dayOfWeek?: number) => void;
}

export function WeeklyHoursCompactSummary({
  weeklyMap,
  onEditWeeklyHours,
}: WeeklyHoursCompactSummaryProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Your Normal Weekly Routine
              <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Auto-repeats weekly
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              These hours automatically repeat every week and populate your upcoming calendar.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEditWeeklyHours()}
          className="h-8 text-xs font-semibold gap-1.5 self-start sm:self-auto border-primary/30 hover:border-primary text-foreground hover:bg-primary/5 shrink-0"
        >
          <CalendarRange className="w-3.5 h-3.5 text-primary" />
          Change Weekly Routine
        </Button>
      </div>

      {/* 7 Compact Weekday Columns / Cards (Mon–Sun) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-0.5">
        {WEEKDAYS.map(({ dow, shortLabel, fullLabel }) => {
          const day = weeklyMap[dow];
          const isEnabled = day?.enabled && day.intervals.length > 0;
          const intervals = day?.intervals ?? [];

          return (
            <button
              key={dow}
              type="button"
              onClick={() => onEditWeeklyHours(dow)}
              className="p-2.5 rounded-xl border border-border/60 bg-surface hover:bg-muted/40 transition-colors text-left group flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title={`Click to edit recurring ${fullLabel} routine`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {shortLabel}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                />
              </div>

              <div className="space-y-0.5">
                {isEnabled ? (
                  intervals.map((inv, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] font-mono font-medium text-foreground/90 whitespace-nowrap"
                    >
                      {inv.startTime}–{inv.endTime}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground/70 italic">
                    Off
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
