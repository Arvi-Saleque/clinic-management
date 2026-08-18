"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { AvailabilityDayCard } from "./availability-day-card";
import { AvailabilityDayEditorDialog } from "./availability-day-editor-dialog";
import type { CalendarDayAvailability } from "@/types/availability";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface AvailabilityCalendarViewProps {
  days: CalendarDayAvailability[];
  practitionerId: string;
  onRefresh: () => void;
  onEditWeeklyHours: (dayOfWeek?: number) => void;
}

export function AvailabilityCalendarView({
  days,
  practitionerId,
  onRefresh,
  onEditWeeklyHours,
}: AvailabilityCalendarViewProps) {
  const [selectedDay, setSelectedDay] = React.useState<CalendarDayAvailability | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleSelectDay = (day: CalendarDayAvailability) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  // Find month transitions to highlight month changes cleanly
  const monthBoundaryMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    let lastMonth = "";
    for (const d of days) {
      const month = format(parseISO(d.date), "MMM yyyy");
      if (month !== lastMonth) {
        map.set(d.date, true);
        lastMonth = month;
      }
    }
    return map;
  }, [days]);

  // Monday-first alignment calculation
  // Domain/JS dayOfWeek: 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Monday-first index: Mon = 0, Tue = 1, Wed = 2, Thu = 3, Fri = 4, Sat = 5, Sun = 6
  const { leadingPlaceholders, trailingPlaceholders } = React.useMemo(() => {
    if (days.length === 0) return { leadingPlaceholders: 0, trailingPlaceholders: 0 };
    const firstDayDow = days[0].dayOfWeek; // 0..6 (Sun=0)
    const leading = (firstDayDow + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
    const totalCells = leading + days.length;
    const trailing = (7 - (totalCells % 7)) % 7;
    return { leadingPlaceholders: leading, trailingPlaceholders: trailing };
  }, [days]);

  return (
    <div className="space-y-4">
      {/* 30-Day Operational Schedule Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* Calendar Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Next 30 Days
              </h3>
              <p className="text-xs text-muted-foreground">
                Your weekly routine is applied automatically. Click a date only for a one-off change, temporary hours or leave.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Normal Hours
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Custom Day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Leave
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/60 bg-muted/40" />
              Off Day
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP & TABLET: 7-Column Aligned Grid View                  */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden sm:block">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pb-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 30-Day Grid with Monday-first weekday column alignment */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Leading Alignment Placeholders */}
            {Array.from({ length: leadingPlaceholders }).map((_, i) => (
              <div
                key={`leading-pad-${i}`}
                aria-hidden="true"
                className="min-h-[118px] rounded-xl border border-dashed border-border/30 bg-muted/10 opacity-30 select-none pointer-events-none"
              />
            ))}

            {/* Actual 30-Day Date Cards */}
            {days.map((day) => (
              <AvailabilityDayCard
                key={day.date}
                day={day}
                isFirstDayOfMonth={monthBoundaryMap.get(day.date) ?? false}
                onSelect={handleSelectDay}
                layout="grid"
              />
            ))}

            {/* Trailing Alignment Placeholders */}
            {Array.from({ length: trailingPlaceholders }).map((_, i) => (
              <div
                key={`trailing-pad-${i}`}
                aria-hidden="true"
                className="min-h-[118px] rounded-xl border border-dashed border-border/30 bg-muted/10 opacity-30 select-none pointer-events-none"
              />
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE: Compact Chronological Agenda Card Stack (390px)       */}
        {/* ------------------------------------------------------------- */}
        <div className="sm:hidden space-y-2">
          {days.map((day) => (
            <AvailabilityDayCard
              key={day.date}
              day={day}
              onSelect={handleSelectDay}
              layout="list"
            />
          ))}
        </div>
      </div>

      {/* Interactive Day Editor Dialog with shortcut bridge to Weekly Working Hours */}
      <AvailabilityDayEditorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        day={selectedDay}
        practitionerId={practitionerId}
        onSuccess={onRefresh}
        onEditRecurringWeekday={onEditWeeklyHours}
      />
    </div>
  );
}
