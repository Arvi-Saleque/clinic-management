"use client";

import * as React from "react";
import { CalendarCheck2, CalendarClock, CalendarOff, Users } from "lucide-react";
import type { CalendarDayAvailability } from "@/types/availability";

interface AvailabilitySummaryStripProps {
  days: CalendarDayAvailability[];
}

export function AvailabilitySummaryStrip({ days }: AvailabilitySummaryStripProps) {
  const scheduledDaysCount = days.filter((d) => d.isAvailable && d.intervals.length > 0).length;
  const oneOffChangesCount = days.filter((d) => d.source === "date_override").length;
  const leaveDaysCount = days.filter((d) => d.source === "full_day_leave").length;
  const totalAppointments = days.reduce((sum, d) => sum + (d.activeAppointmentCount ?? 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Metric 1: Scheduled Days */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CalendarCheck2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Scheduled Days</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {scheduledDaysCount} <span className="text-xs font-normal text-muted-foreground">/ 30</span>
          </div>
        </div>
      </div>

      {/* Metric 2: One-off Changes */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <CalendarClock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">One-off Changes</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {oneOffChangesCount} <span className="text-xs font-normal text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Leave Days */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <CalendarOff className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Leave Days</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {leaveDaysCount} <span className="text-xs font-normal text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Booked Appointments */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Booked Appointments</div>
          <div className="text-lg font-bold text-foreground tracking-tight">
            {totalAppointments} <span className="text-xs font-normal text-muted-foreground">appointments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
