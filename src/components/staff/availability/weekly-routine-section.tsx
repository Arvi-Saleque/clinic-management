"use client";

import * as React from "react";
import { Edit3, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayAvailability } from "@/types/availability";
import { cn } from "@/lib/utils";

const DAYS = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

interface WeeklyRoutineSectionProps {
  weeklyMap: Record<number, DayAvailability>;
  onOpenEditor: (dayOfWeek?: number) => void;
}

export function WeeklyRoutineSection({
  weeklyMap,
  onOpenEditor,
}: WeeklyRoutineSectionProps) {
  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Weekly Routine
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your regular weekly working hours.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenEditor()}
            className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
          >
            <Edit3 className="size-3.5" />
            Edit Routine
          </Button>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS.map((day) => {
            const rule = weeklyMap[day.dow];
            const isEnabled = rule?.enabled && rule.intervals.length > 0;

            return (
              <div
                key={day.dow}
                className="rounded-2xl border border-border/70 bg-card p-3.5 flex flex-col justify-between min-h-[170px] shadow-2xs transition-all hover:border-border"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="font-heading font-bold text-xs text-foreground">
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isEnabled ? "bg-emerald-500" : "bg-muted-foreground/30",
                    )}
                  />
                </div>

                {/* Body: Intervals */}
                <div className="space-y-1.5 my-2 flex-1 flex flex-col justify-center">
                  {isEnabled ? (
                    rule.intervals.map((inv, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/60 bg-muted/20 px-2 py-1.5 text-center text-[11px] font-bold tabular-nums text-foreground tracking-tight"
                      >
                        {inv.startTime} – {inv.endTime}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-3 text-center text-[11px] font-medium text-muted-foreground">
                      Day off
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <button
                  type="button"
                  onClick={() => onOpenEditor(day.dow)}
                  className="w-full text-center py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="size-2.5" /> Add slot
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Bottom Helper Tip */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
        <Info className="size-3.5 text-primary shrink-0" />
        <span className="text-[11px]">
          <strong>Tip:</strong> Click any date in the calendar to adjust availability for that specific day.
        </span>
      </div>
    </div>
  );
}
