"use client";

import * as React from "react";
import { format, addMonths, subMonths } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { computeMonthCalendarDays } from "@/lib/availability";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarGridProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  calendarDays: ReturnType<typeof computeMonthCalendarDays>;
}

const WEEKDAYS = [
  { label: "MON", isWeekend: false },
  { label: "TUE", isWeekend: false },
  { label: "WED", isWeekend: false },
  { label: "THU", isWeekend: false },
  { label: "FRI", isWeekend: false },
  { label: "SAT", isWeekend: true },
  { label: "SUN", isWeekend: true },
];

export function AvailabilityCalendarGrid({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  calendarDays,
}: AvailabilityCalendarGridProps) {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    onMonthChange(today);
    onSelectDate(format(today, "yyyy-MM-dd"));
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5 transition-all">
      {/* ------------------------------------------------------------- */}
      {/* Month Toolbar Header                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        {/* Month Title & Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="size-9 sm:size-10 rounded-2xl bg-gradient-to-br from-[#0B3B36] to-[#075e5a] text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarIcon className="size-4 sm:size-5" />
          </div>

          <div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-foreground tracking-tight flex items-center gap-2">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
              Click any date to customize hours or record leave
            </p>
          </div>
        </div>

        {/* Action Controls: Prev, Next, Today */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="inline-flex rounded-2xl border border-border/80 bg-muted/20 p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card transition-all"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8.5 rounded-2xl px-3.5 text-xs font-extrabold border-border/80 bg-card hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-all shadow-2xs gap-1.5"
          >
            <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
            Today
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Weekday Header Labels                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 select-none">
        {WEEKDAYS.map((day) => (
          <div
            key={day.label}
            className={cn(
              "text-[11px] sm:text-xs font-black tracking-wider text-center py-2 rounded-xl transition-colors",
              day.isWeekend
                ? "text-teal-700/90 dark:text-teal-400/90 bg-teal-50/40 dark:bg-teal-950/20"
                : "text-muted-foreground/80 bg-muted/15",
            )}
          >
            {day.label}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Calendar 7-Column Day Matrix                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const isFirstOfMonth = day.dayNumber === 1;

          // Status color configurations
          const isAvailable = day.statusType === "available";
          const isAdjusted = day.statusType === "adjusted";
          const isLeave = day.statusType === "leave";
          const isOff = day.statusType === "off";

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "group relative min-h-[74px] sm:min-h-[86px] lg:min-h-[92px] rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-all duration-200 text-left outline-none border",
                // 1. SELECTED STATE (Ultra Premium luxury teal gradient)
                isSelected
                  ? "bg-gradient-to-br from-[#0B3B36] via-[#075e5a] to-[#04332f] text-white border-2 border-emerald-400 shadow-md shadow-emerald-950/25 ring-4 ring-emerald-500/20 scale-[1.02] z-10"
                  // 2. TODAY (When not selected)
                  : day.isToday
                    ? "border-2 border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-xs ring-2 ring-emerald-500/20 hover:scale-[1.02]"
                    // 3. ON LEAVE (Vibrant warm Yellow/Amber shade matching green available)
                    : isLeave && day.isCurrentMonth
                      ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300/90 dark:border-amber-700/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 hover:border-amber-400 hover:shadow-xs hover:scale-[1.01]"
                      // 4. ADJUSTED HOURS (Violet gradient)
                      : isAdjusted && day.isCurrentMonth
                        ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-200/90 dark:border-purple-800/60 hover:border-purple-400 hover:shadow-sm hover:scale-[1.01]"
                        // 5. AVAILABLE (Clean green surface & soft emerald hover)
                        : isAvailable && day.isCurrentMonth
                          ? "bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-border/70 hover:border-emerald-300 hover:shadow-sm hover:scale-[1.01]"
                          // 6. DAY OFF (Clean modern slate-grey neutral)
                          : isOff && day.isCurrentMonth
                            ? "bg-slate-50/60 dark:bg-slate-900/30 border border-dashed border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-100/60 hover:border-slate-400 text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                            // 7. OUTSIDE CURRENT MONTH
                            : "opacity-30 hover:opacity-75 bg-muted/5 border-transparent text-muted-foreground/60",
              )}
            >
              {/* Top Row: Big Date Number + Mini Badges */}
              <div className="flex items-start justify-between w-full">
                {/* Date Number - BIG, VIBRANT, & PROMINENT */}
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "font-heading font-black tabular-nums transition-colors tracking-tight",
                      isSelected
                        ? "text-xl sm:text-2xl text-white"
                        : day.isToday
                          ? "text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200"
                          : isLeave && day.isCurrentMonth
                            ? "text-base sm:text-lg font-black text-amber-950 dark:text-amber-200"
                            : isAdjusted && day.isCurrentMonth
                              ? "text-base sm:text-lg text-purple-950 dark:text-purple-200"
                              : isOff && day.isCurrentMonth
                                ? "text-base sm:text-lg font-black text-slate-800 dark:text-slate-200"
                                : day.isCurrentMonth
                                  ? "text-base sm:text-lg text-foreground group-hover:text-emerald-900 dark:group-hover:text-emerald-200"
                                  : "text-sm sm:text-base text-muted-foreground/50",
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Month name tag on 1st of month */}
                  {isFirstOfMonth && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isSelected
                          ? "text-emerald-200"
                          : isLeave && day.isCurrentMonth
                            ? "text-amber-800/80 dark:text-amber-300/80 font-bold"
                            : day.isCurrentMonth
                              ? "text-muted-foreground font-semibold"
                              : "text-muted-foreground/50",
                      )}
                    >
                      {format(day.dayDate, "MMM")}
                    </span>
                  )}
                </div>

                {/* Top Right: "TODAY" Badge or Appointment Counter */}
                <div className="flex items-center gap-1">
                  {day.isToday && !isSelected && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                      Today
                    </span>
                  )}

                  {day.activeAppointmentCount > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums transition-colors",
                        isSelected
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60",
                      )}
                      title={`${day.activeAppointmentCount} active bookings`}
                    >
                      <Users className="size-2.5 shrink-0" />
                      {day.activeAppointmentCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Status Tag Pill / Dot Indicator */}
              <div className="flex items-center justify-between w-full pt-1.5 sm:pt-2">
                {/* Selected Day Pill */}
                {isSelected ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20">
                    <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="truncate max-w-[70px]">
                      {isLeave ? "On Leave" : isAdjusted ? "Adjusted" : isAvailable ? "Available" : "Day Off"}
                    </span>
                  </div>
                ) : (
                  /* Standard Status Indicator - ALL STATES HAVE BEAUTIFUL CONSISTENT PILL BADGES */
                  <div className="flex items-center gap-1.5 w-full">
                    {isAvailable && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-500/50" />
                        <span>Available</span>
                      </div>
                    )}

                    {isLeave && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 text-[10px] font-black border border-amber-300/90 dark:border-amber-700/60 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-amber-500 shadow-2xs shadow-amber-500/50 ring-1 ring-amber-500/30" />
                        <span>On Leave</span>
                      </div>
                    )}

                    {isAdjusted && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100/80 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200/80 dark:border-purple-800/40 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-purple-600 shadow-2xs shadow-purple-500/50" />
                        <span>Adjusted</span>
                      </div>
                    )}

                    {isOff && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-300 text-[10px] font-extrabold border border-slate-300/80 dark:border-slate-700/70 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-400" />
                        <span>Day Off</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Status Legend - Colorful & Interactive Pills           */}
      {/* ------------------------------------------------------------- */}
      <div className="border-t border-border/60 pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 shadow-2xs">
          <span className="size-2.5 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-500/50 ring-2 ring-emerald-500/20" />
          <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200">
            Available (Regular)
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/50 shadow-2xs">
          <span className="size-2.5 rounded-full bg-amber-500 shadow-2xs shadow-amber-500/50 ring-2 ring-amber-500/30" />
          <span className="text-[11px] font-black text-amber-950 dark:text-amber-200">
            On leave
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 shadow-2xs">
          <span className="size-2.5 rounded-full bg-purple-600 shadow-2xs shadow-purple-500/50 ring-2 ring-purple-500/20" />
          <span className="text-[11px] font-bold text-purple-950 dark:text-purple-200">
            Adjusted hours
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/70 shadow-2xs">
          <span className="size-2.5 rounded-full bg-slate-400 ring-2 ring-slate-400/20" />
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
            Day off
          </span>
        </div>
      </div>
    </div>
  );
}
