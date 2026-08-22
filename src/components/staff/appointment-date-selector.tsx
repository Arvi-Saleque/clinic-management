"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentDateSelectorProps {
  currentDate: string; // 'yyyy-MM-dd'
  onSelectDate: (date: string) => void;
  className?: string;
}

export function AppointmentDateSelector({
  currentDate,
  onSelectDate,
  className,
}: AppointmentDateSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse current date safely to avoid timezone shifting
  const selectedDateObj = React.useMemo(() => {
    const [y, m, d] = currentDate.split("-").map(Number);
    if (y && m && d) {
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [currentDate]);

  // Month currently viewed in the popover calendar
  const [viewMonth, setViewMonth] = React.useState<Date>(selectedDateObj);

  // Sync viewed month when selectedDateObj changes
  React.useEffect(() => {
    setViewMonth(selectedDateObj);
  }, [selectedDateObj]);

  // Close popover on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Generate calendar grid days for viewMonth
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewMonth]);

  const handleSelect = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onSelectDate(formatted);
    setIsOpen(false);
  };

  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = format(addDays(selectedDateObj, -1), "yyyy-MM-dd");
    onSelectDate(prev);
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = format(addDays(selectedDateObj, 1), "yyyy-MM-dd");
    onSelectDate(next);
  };

  const handleTodayJump = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = format(new Date(), "yyyy-MM-dd");
    onSelectDate(today);
    setViewMonth(new Date());
    setIsOpen(false);
  };

  const isCurrentDateToday = isToday(selectedDateObj);
  const formattedHeaderDate = isCurrentDateToday
    ? `Today · ${format(selectedDateObj, "EEE, d MMM yyyy")}`
    : format(selectedDateObj, "EEEE, d MMM yyyy");

  return (
    <div ref={containerRef} className={cn("relative z-30 flex items-center gap-1.5", className)}>
      {/* 1. Integrated Date Stepper & Trigger Capsule */}
      <div
        className={cn(
          "flex items-center rounded-2xl border bg-card/95 p-1 shadow-2xs backdrop-blur-xs transition-all duration-200",
          isOpen
            ? "border-primary ring-2 ring-primary/15 shadow-md"
            : "border-border/80 hover:border-primary/40"
        )}
      >
        {/* Prev Day Quick Stepper Button */}
        <button
          type="button"
          onClick={handlePrevDay}
          title="Previous day"
          aria-label="Previous day"
          className="size-7.5 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {/* Main Trigger Capsule */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="flex items-center gap-2.5 px-2.5 py-1 text-left cursor-pointer select-none min-w-[190px] sm:min-w-[230px]"
        >
          {/* Icon Capsule */}
          <div className="size-7.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarIcon className="size-3.5" />
          </div>

          {/* Date Information */}
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none block">
              Appointment Date
            </span>
            <p className="mt-0.5 text-xs font-bold text-foreground truncate">
              {formattedHeaderDate}
            </p>
          </div>

          {/* Chevrons */}
          <ChevronsUpDown
            className={cn(
              "size-3.5 text-muted-foreground/80 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </button>

        {/* Next Day Quick Stepper Button */}
        <button
          type="button"
          onClick={handleNextDay}
          title="Next day"
          aria-label="Next day"
          className="size-7.5 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* 2. Interactive Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[310px] sm:w-[330px] origin-top-left rounded-3xl border border-border/90 bg-card p-3.5 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10 z-50">
          {/* Popover Header: Month Navigator + Today Shortcut */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xs font-black tracking-tight text-foreground">
                {format(viewMonth, "MMMM yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleTodayJump}
                className={cn(
                  "h-7 px-2 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer",
                  isCurrentDateToday
                    ? "bg-primary/10 text-primary border-primary/25"
                    : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/70"
                )}
                title="Jump to today"
              >
                <RotateCcw className="size-2.5" />
                Today
              </button>

              <div className="flex items-center rounded-lg border border-border/60 bg-muted/20 p-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="grid grid-cols-4 gap-1 py-2.5 border-b border-border/70">
            {[
              { label: "Yesterday", date: subDays(new Date(), 1) },
              { label: "Today", date: new Date() },
              { label: "Tomorrow", date: addDays(new Date(), 1) },
              { label: "+7 Days", date: addDays(new Date(), 7) },
            ].map((preset) => {
              const isPresetSelected = isSameDay(preset.date, selectedDateObj);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelect(preset.date)}
                  className={cn(
                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer truncate",
                    isPresetSelected
                      ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Weekday Header Labels */}
          <div className="grid grid-cols-7 gap-1 pt-2.5 pb-1 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((dayName) => (
              <span
                key={dayName}
                className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 py-1">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDateObj);
              const isDayToday = isToday(day);
              const isCurrentMonth = isSameMonth(day, viewMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "size-8.5 rounded-xl text-xs font-semibold flex items-center justify-center relative transition-all cursor-pointer",
                    !isCurrentMonth && "text-muted-foreground/35 hover:text-muted-foreground",
                    isCurrentMonth && !isSelected && "text-foreground hover:bg-muted/60",
                    isDayToday &&
                      !isSelected &&
                      "font-black text-primary border border-primary/40 bg-primary/5",
                    isSelected &&
                      "bg-primary text-primary-foreground font-black shadow-xs ring-2 ring-primary/25 scale-105"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {isDayToday && !isSelected && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Info Strip */}
          <div className="pt-2.5 mt-1 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span className="flex items-center gap-1 font-medium truncate">
              <CalendarDays className="size-3 text-primary shrink-0" />
              <span>{format(selectedDateObj, "d MMMM yyyy")}</span>
            </span>
            <span className="font-mono text-[9px] bg-muted/80 px-1.5 py-0.5 rounded font-semibold text-muted-foreground shrink-0">
              ESC
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
