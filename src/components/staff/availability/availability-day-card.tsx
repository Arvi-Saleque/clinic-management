"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarOff, ChevronRight, Clock, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CalendarDayAvailability } from "@/types/availability";
import { cn } from "@/lib/utils";

interface AvailabilityDayCardProps {
  day: CalendarDayAvailability;
  isFirstDayOfMonth?: boolean;
  onSelect: (day: CalendarDayAvailability) => void;
  layout?: "grid" | "list";
}

export function AvailabilityDayCard({
  day,
  isFirstDayOfMonth = false,
  onSelect,
  layout = "grid",
}: AvailabilityDayCardProps) {
  const dateObj = React.useMemo(() => parseISO(day.date), [day.date]);
  const dayOfWeekShort = format(dateObj, "EEE").toUpperCase();
  const dayOfMonth = format(dateObj, "d");
  const monthShort = format(dateObj, "MMM").toUpperCase();

  const isCustom = day.source === "date_override";
  const isLeave = day.source === "full_day_leave";
  const isAvailable = day.isAvailable && day.intervals.length > 0;
  const appointmentCount = day.activeAppointmentCount ?? 0;

  if (layout === "list") {
    return (
      <button
        type="button"
        onClick={() => onSelect(day)}
        className={cn(
          "w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          day.isToday && "border-primary/60 bg-primary/[0.03] shadow-xs",
          !day.isToday && "border-border/70 bg-card hover:bg-muted/40",
          isCustom && "border-indigo-500/30 bg-indigo-500/[0.02]",
          isLeave && "border-amber-500/30 bg-amber-500/[0.02]",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Date Stamp */}
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border",
              day.isToday
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/60 text-foreground border-border/60",
            )}
          >
            <span className="text-[10px] font-semibold tracking-wider leading-none">
              {dayOfWeekShort}
            </span>
            <span className="text-base font-bold leading-tight">{dayOfMonth}</span>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {format(dateObj, "EEE, d MMM")}
              </span>
              {day.isToday && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                  Today
                </Badge>
              )}
              {isCustom && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 font-medium"
                >
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Adjusted
                </Badge>
              )}
              {isLeave && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-medium"
                >
                  <CalendarOff className="w-2.5 h-2.5 mr-1" />
                  Leave
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              {isLeave ? (
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {day.leaveReason || "Full-day leave / unavailable"}
                </span>
              ) : isAvailable ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {day.intervals.map((inv) => `${inv.startTime}–${inv.endTime}`).join(", ")}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Day Off</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Badge + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {appointmentCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
            >
              <Users className="w-3 h-3 mr-1" />
              {appointmentCount} {appointmentCount === 1 ? "appointment" : "appointments"}
            </Badge>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    );
  }

  // Desktop / Tablet Grid Card
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className={cn(
        "relative w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[118px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        day.isToday && "border-primary ring-1 ring-primary/40 bg-primary/[0.02] shadow-xs",
        !day.isToday && "border-border/70 bg-card hover:bg-muted/40 hover:border-border",
        isCustom && "border-indigo-500/40 bg-indigo-500/[0.02]",
        isLeave && "border-amber-500/40 bg-amber-500/[0.02]",
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-1 w-full">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-base font-bold tracking-tight leading-none",
              day.isToday ? "text-primary" : "text-foreground",
            )}
          >
            {dayOfMonth}
          </span>
          {dayOfMonth === "1" ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1 py-0.5 rounded leading-none">
              {monthShort}
            </span>
          ) : (isFirstDayOfMonth || day.isToday) ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {monthShort}
            </span>
          ) : null}
        </div>

        {/* State Indicators */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {day.isToday && (
            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground leading-none">
              Today
            </span>
          )}
          {isCustom && (
            <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 leading-none">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Adjusted
            </span>
          )}
          {isLeave && (
            <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 leading-none">
              <CalendarOff className="w-2.5 h-2.5 mr-0.5" />
              Leave
            </span>
          )}
        </div>
      </div>

      {/* Interval / Availability Body */}
      <div className="my-2 space-y-1 w-full">
        {isLeave ? (
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium leading-tight truncate">
            {day.leaveReason || "On Leave"}
          </div>
        ) : isAvailable ? (
          <div className="space-y-1">
            {day.intervals.slice(0, 2).map((inv, idx) => (
              <div
                key={`${inv.startTime}-${inv.endTime}-${idx}`}
                className="flex items-center gap-1 text-[11px] font-medium text-foreground/90 bg-muted/60 dark:bg-muted/40 px-1.5 py-0.5 rounded-md leading-tight"
              >
                <Clock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  {inv.startTime} – {inv.endTime}
                </span>
              </div>
            ))}
            {day.intervals.length > 2 && (
              <div className="text-[10px] text-muted-foreground font-medium pl-1">
                +{day.intervals.length - 2} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground font-medium italic pl-0.5">
            Day Off
          </div>
        )}
      </div>

      {/* Card Footer: Appointment Count */}
      <div className="flex items-center justify-between w-full pt-1 border-t border-border/40 text-[11px]">
        {appointmentCount > 0 ? (
          <span className="inline-flex items-center font-semibold text-primary gap-1">
            <Users className="w-3 h-3 shrink-0" />
            {appointmentCount} {appointmentCount === 1 ? "appointment" : "appointments"}
          </span>
        ) : (
          <span className="text-muted-foreground/60 text-[10px]">No appointments</span>
        )}
        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          Edit
        </span>
      </div>
    </button>
  );
}
