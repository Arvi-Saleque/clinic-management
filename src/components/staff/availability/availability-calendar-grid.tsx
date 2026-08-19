"use client";

import * as React from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      {/* Month Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="font-heading font-bold text-sm sm:text-base text-foreground ml-1">
            {format(currentMonth, "MMMM yyyy")}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="h-8 rounded-xl px-3 text-xs font-semibold"
        >
          Today
        </Button>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-[11px] font-bold tracking-wider text-muted-foreground text-center py-1 select-none"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Matrix Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const isFirstOfMonth = day.dayNumber === 1 && !day.isCurrentMonth;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "group relative min-h-[64px] sm:min-h-[72px] rounded-xl flex flex-col items-center justify-between p-2 transition-all text-center border",
                isSelected
                  ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-[#0B3B36] ring-2 ring-[#0B3B36]/20 shadow-2xs"
                  : day.isCurrentMonth
                    ? "bg-card hover:bg-muted/40 border-border/50"
                    : "bg-muted/10 border-transparent text-muted-foreground/40 hover:bg-muted/20",
              )}
            >
              {/* Top Day Number / Badge */}
              <div className="flex items-center justify-center w-full">
                {isSelected ? (
                  <span className="size-7 sm:size-8 rounded-full bg-[#0B3B36] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {day.dayNumber}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-bold transition-colors",
                      day.isToday
                        ? "size-7 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 flex items-center justify-center font-extrabold"
                        : day.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/40",
                    )}
                  >
                    {isFirstOfMonth ? `${day.dayNumber} ${format(day.dayDate, "MMM")}` : day.dayNumber}
                  </span>
                )}
              </div>

              {/* Bottom Dot Status Indicator */}
              <div className="flex items-center justify-center gap-1 w-full pt-1">
                {day.statusType === "available" && (
                  <span
                    className="size-1.5 rounded-full bg-emerald-500"
                    title="Available working day"
                  />
                )}
                {day.statusType === "adjusted" && (
                  <span
                    className="size-1.5 rounded-full bg-purple-500"
                    title="Adjusted hours (Custom date override)"
                  />
                )}
                {day.statusType === "leave" && (
                  <span
                    className="size-1.5 rounded-full bg-amber-500"
                    title="On leave"
                  />
                )}
                {day.statusType === "off" && (
                  <span
                    className="size-1.5 rounded-full bg-muted-foreground/30"
                    title="Day off"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Status Legend */}
      <div className="border-t border-border/50 pt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-purple-500" />
          <span className="text-[11px] font-medium text-foreground">Adjusted hours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="text-[11px] font-medium text-foreground">On leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="text-[11px] font-medium text-foreground">Day off</span>
        </div>
      </div>
    </div>
  );
}
