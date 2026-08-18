"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  RotateCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvailabilitySummaryStrip } from "./availability/availability-summary-strip";
import { WeeklyHoursCompactSummary } from "./availability/weekly-hours-compact-summary";
import { AvailabilityCalendarView } from "./availability/availability-calendar-view";
import { WeeklyTemplateView } from "./availability/weekly-template-view";
import { computeUpcoming30DaysAvailability } from "@/lib/availability";
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  DayAvailability,
} from "@/types/availability";

interface AvailabilityPlannerProps {
  practitionerId: string;
  branchId?: string;
  rules: AvailabilityRuleRow[];
  exceptions?: AvailabilityExceptionRow[];
  appointmentCounts?: Record<string, number>;
}

export function AvailabilityPlanner({
  practitionerId,
  branchId = "",
  rules,
  exceptions = [],
  appointmentCounts = {},
}: AvailabilityPlannerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"overview" | "weekly-editor">("overview");
  const [focusedWeekday, setFocusedWeekday] = React.useState<number | null>(null);

  // Transform database rules into weekly map for template editor and summary
  const weeklyMap = React.useMemo(() => {
    const map: Record<number, DayAvailability> = {};
    for (let dow = 0; dow <= 6; dow++) {
      const matchingRules = rules.filter((r) => r.day_of_week === dow);
      if (matchingRules.length > 0) {
        map[dow] = {
          dayOfWeek: dow,
          enabled: true,
          intervals: matchingRules.map((r) => ({
            id: r.id,
            startTime: r.start_time.slice(0, 5),
            endTime: r.end_time.slice(0, 5),
          })),
        };
      } else {
        map[dow] = {
          dayOfWeek: dow,
          enabled: false,
          intervals: [{ startTime: "09:00", endTime: "17:00" }],
        };
      }
    }
    return map;
  }, [rules]);

  // Compute rolling 30-day operational availability
  const thirtyDays = React.useMemo(() => {
    return computeUpcoming30DaysAvailability(rules, exceptions, appointmentCounts);
  }, [rules, exceptions, appointmentCounts]);

  const handleRefresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleOpenWeeklyEditor = React.useCallback((dayOfWeek?: number) => {
    setViewMode("weekly-editor");
    if (typeof dayOfWeek === "number") {
      setFocusedWeekday(dayOfWeek);
    }
  }, []);

  const handleBackToOverview = React.useCallback(() => {
    setViewMode("overview");
    setFocusedWeekday(null);
  }, []);

  return (
    <section className="space-y-4">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary mb-1">
            <Clock className="w-3.5 h-3.5" />
            Operational Schedule Control
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Working Hours & Availability
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Set your regular working hours and make one-off changes when needed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs font-semibold gap-1.5 h-8"
            title="Refresh availability schedule"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DEFAULT OVERVIEW MODE (No Permanent Tabs)                   */}
      {/* ------------------------------------------------------------- */}
      {viewMode === "overview" && (
        <div className="space-y-4">
          {/* Step 1: Top Compact Operational KPI Strip */}
          <AvailabilitySummaryStrip days={thirtyDays} />

          {/* Step 2: Regular Weekly Hours (Directly above 30-Day Calendar) */}
          <WeeklyHoursCompactSummary
            weeklyMap={weeklyMap}
            onEditWeeklyHours={handleOpenWeeklyEditor}
          />

          {/* Step 3: Upcoming 30 Days Operational Calendar */}
          <AvailabilityCalendarView
            days={thirtyDays}
            practitionerId={practitionerId}
            onRefresh={handleRefresh}
            onEditWeeklyHours={handleOpenWeeklyEditor}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DEDICATED WEEKLY EDITING MODE (Temporary Flow)              */}
      {/* ------------------------------------------------------------- */}
      {viewMode === "weekly-editor" && (
        <div className="space-y-3">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToOverview}
              className="text-xs font-semibold gap-1.5 h-8 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Schedule Overview
            </Button>
          </div>

          {/* Weekly Editor Container */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <CalendarRange className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Weekly Working Hours
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set your normal working routine. These hours automatically repeat every week unless a specific date has a one-off change.
                </p>
              </div>
            </div>

            <WeeklyTemplateView
              branchId={branchId}
              practitionerId={practitionerId}
              initialRules={weeklyMap}
              focusedWeekday={focusedWeekday}
              onSuccess={() => {
                handleRefresh();
                handleBackToOverview();
              }}
              onViewScheduleOverview={handleBackToOverview}
            />
          </div>
        </div>
      )}
    </section>
  );
}
