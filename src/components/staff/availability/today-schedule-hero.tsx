"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import type { TimeInterval } from "@/types/availability";

interface TodayScheduleHeroProps {
  todayDate: Date;
  isAvailable: boolean;
  intervals: TimeInterval[];
  statusType: "available" | "adjusted" | "leave" | "off";
  leaveReason?: string | null;
}

export function TodayScheduleHero({
  todayDate,
  isAvailable,
  intervals,
  statusType,
  leaveReason,
}: TodayScheduleHeroProps) {
  const formattedDate = format(todayDate, "EEEE, d MMMM yyyy");
  const isWorking = isAvailable && intervals.length > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
            <CalendarDays className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Today&apos;s Schedule
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isWorking ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
              <span className="size-2 rounded-full bg-emerald-600" />
              Working day
            </span>
          ) : statusType === "leave" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50/80 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
              <span className="size-2 rounded-full bg-amber-600" />
              On leave {leaveReason ? `(${leaveReason})` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/60">
              <span className="size-2 rounded-full bg-muted-foreground/60" />
              Day off
            </span>
          )}
        </div>
      </div>

      {/* Working Hour Chips */}
      {isWorking ? (
        <div className="flex flex-wrap items-center gap-3">
          {intervals.map((inv, idx) => (
            <React.Fragment key={`${inv.startTime}-${inv.endTime}-${idx}`}>
              <div className="flex-1 min-w-[200px] sm:min-w-[240px] flex items-center justify-center gap-2.5 rounded-2xl border border-border/70 bg-muted/20 px-6 py-4 transition-colors hover:bg-muted/30">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-heading font-bold text-base text-foreground tabular-nums tracking-tight">
                  {inv.startTime} – {inv.endTime}
                </span>
              </div>
              {idx < intervals.length - 1 && (
                <span className="text-muted-foreground/40 font-bold text-lg hidden md:inline-block select-none">
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-5 text-center text-xs font-medium text-muted-foreground">
          {statusType === "leave"
            ? `Marked on leave today: ${leaveReason || "Scheduled leave"}.`
            : "No working hours scheduled for today."}
        </div>
      )}
    </div>
  );
}
