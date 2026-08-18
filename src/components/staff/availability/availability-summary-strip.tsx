"use client";

import * as React from "react";
import { CalendarCheck2, CalendarClock, CalendarOff, Users } from "lucide-react";
import type { CalendarDayAvailability } from "@/types/availability";

interface AvailabilitySummaryStripProps {
  days: CalendarDayAvailability[];
}

export function AvailabilitySummaryStrip({ days }: AvailabilitySummaryStripProps) {
  const workingDaysCount = days.filter((d) => d.isAvailable && d.intervals.length > 0).length;
  const customDaysCount = days.filter((d) => d.source === "date_override").length;
  const leaveDaysCount = days.filter((d) => d.source === "full_day_leave").length;
  const totalAppointments = days.reduce((sum, d) => sum + (d.activeAppointmentCount ?? 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Metric 1: Working Days */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CalendarCheck2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Working Days</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {workingDaysCount} <span className="text-xs font-normal text-muted-foreground">/ 30</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Custom Hours */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <CalendarClock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Custom Overrides</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {customDaysCount} <span className="text-xs font-normal text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Planned Leave */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <CalendarOff className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Planned Leave</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {leaveDaysCount} <span className="text-xs font-normal text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Booked Visits */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Active Visits</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {totalAppointments} <span className="text-xs font-normal text-muted-foreground">booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
