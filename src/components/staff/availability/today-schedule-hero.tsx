"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Clock, Sparkles } from "lucide-react";
import type { TimeInterval } from "@/types/availability";

interface TodayScheduleHeroProps {
  todayDate: Date;
  isAvailable: boolean;
  intervals: TimeInterval[];
  statusType: "available" | "adjusted" | "leave" | "off";
  leaveReason?: string | null;
}

function getSlotDuration(start: string, end: string) {
  if (!start || !end || start >= end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin <= 0) return "";
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs}h ${mins}m`;
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
    <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs space-y-4 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-[#0B3B36] to-[#075e5a] text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              Today&apos;s Schedule
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isWorking ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-500/50 animate-pulse" />
              Available for Practice
            </span>
          ) : statusType === "leave" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700 shadow-2xs">
              <span className="size-2 rounded-full bg-amber-500 shadow-2xs shadow-amber-500/50" />
              On leave {leaveReason ? `(${leaveReason})` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black bg-muted/60 text-muted-foreground border border-border/70 shadow-2xs">
              <span className="size-2 rounded-full bg-muted-foreground/60" />
              Day off
            </span>
          )}
        </div>
      </div>

      {/* Working Hour Chips */}
      {isWorking ? (
        <div className="flex flex-wrap items-center gap-3">
          {intervals.map((inv, idx) => {
            const duration = getSlotDuration(inv.startTime, inv.endTime);

            return (
              <React.Fragment key={`${inv.startTime}-${inv.endTime}-${idx}`}>
                <div className="flex-1 min-w-[200px] sm:min-w-[240px] flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/30 px-5 py-3.5 transition-all hover:bg-emerald-50/70 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center">
                      <Clock className="size-4" />
                    </div>
                    <span className="font-heading font-black text-base text-emerald-950 dark:text-emerald-100 tabular-nums tracking-tight">
                      {inv.startTime} – {inv.endTime}
                    </span>
                  </div>

                  {duration && (
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
                      {duration}
                    </span>
                  )}
                </div>
                {idx < intervals.length - 1 && (
                  <span className="text-muted-foreground/40 font-black text-xl hidden md:inline-block select-none">
                    +
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-5 text-center text-xs font-medium text-muted-foreground shadow-2xs">
          {statusType === "leave"
            ? `Marked on leave today: ${leaveReason || "Scheduled leave"}.`
            : "No working hours scheduled for today."}
        </div>
      )}
    </div>
  );
}
