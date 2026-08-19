"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { TodayScheduleHero } from "./availability/today-schedule-hero";
import { AvailabilityCalendarGrid } from "./availability/availability-calendar-grid";
import { AvailabilityDayDetailsPanel } from "./availability/availability-day-details-panel";
import { WeeklyRoutineSection } from "./availability/weekly-routine-section";
import { WeeklyRoutineDialog } from "./availability/weekly-routine-dialog";
import {
  computeMonthCalendarDays,
  resolveEffectiveDayAvailability,
} from "@/lib/availability";
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
  userRole?: string;
}

export function AvailabilityPlanner({
  practitionerId,
  rules,
  exceptions = [],
  appointmentCounts = {},
  userRole = "dentist",
}: AvailabilityPlannerProps) {
  const router = useRouter();
  const isReadOnly = userRole === "receptionist";

  // Active month for calendar view
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date());

  // Selected date for day details editing (defaults to today)
  const todayStr = React.useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr);

  // Weekly Routine Modal State
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = React.useState(false);
  const [focusedWeekday, setFocusedWeekday] = React.useState<number | null>(null);

  // Transform database rules into weekly map for weekly routine section & dialog
  const weeklyMap = React.useMemo(() => {
    const map: Record<number, DayAvailability> = {};
    for (let dow = 0; dow <= 6; dow++) {
      const matchingRules = rules.filter((r) => r.day_of_week === dow);
      if (matchingRules.length > 0) {
        map[dow] = {
          dayOfWeek: dow,
          enabled: true,
          intervals: matchingRules.map((r) => ({
            startTime: r.start_time.slice(0, 5),
            endTime: r.end_time.slice(0, 5),
          })),
        };
      } else {
        map[dow] = {
          dayOfWeek: dow,
          enabled: false,
          intervals: [],
        };
      }
    }
    return map;
  }, [rules]);

  // Today's schedule data
  const todayEffective = React.useMemo(() => {
    return resolveEffectiveDayAvailability(todayStr, rules, exceptions);
  }, [todayStr, rules, exceptions]);

  // Selected date schedule data
  const selectedEffective = React.useMemo(() => {
    return resolveEffectiveDayAvailability(selectedDate, rules, exceptions);
  }, [selectedDate, rules, exceptions]);

  // Month calendar matrix
  const calendarDays = React.useMemo(() => {
    return computeMonthCalendarDays(currentMonth, rules, exceptions, appointmentCounts);
  }, [currentMonth, rules, exceptions, appointmentCounts]);

  const handleRefresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleOpenWeeklyEditor = React.useCallback((dayOfWeek?: number) => {
    if (isReadOnly) return;
    setFocusedWeekday(dayOfWeek ?? null);
    setIsWeeklyModalOpen(true);
  }, [isReadOnly]);

  return (
    <div className="space-y-6 w-full">
      {/* ------------------------------------------------------------- */}
      {/* Layer 1: TODAY'S SCHEDULE                                     */}
      {/* ------------------------------------------------------------- */}
      <TodayScheduleHero
        todayDate={new Date()}
        isAvailable={todayEffective.isAvailable}
        intervals={todayEffective.intervals}
        statusType={
          todayEffective.source === "full_day_leave"
            ? "leave"
            : todayEffective.source === "date_override"
              ? "adjusted"
              : todayEffective.isAvailable && todayEffective.intervals.length > 0
                ? "available"
                : "off"
        }
        leaveReason={todayEffective.leaveReason}
      />

      {/* ------------------------------------------------------------- */}
      {/* Layer 2: MAIN 2-COLUMN AVAILABILITY WORKSPACE (Calendar + Day Panel) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~67% / 8 cols): Month Calendar */}
        <div className="lg:col-span-7 xl:col-span-8">
          <AvailabilityCalendarGrid
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            calendarDays={calendarDays}
          />
        </div>

        {/* Right Column (~33% / 4 cols): Selected Date Details Panel */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <AvailabilityDayDetailsPanel
            key={`${selectedDate}-${selectedEffective.source}`}
            practitionerId={practitionerId}
            selectedDate={selectedDate}
            source={selectedEffective.source}
            isInitialAvailable={selectedEffective.isAvailable}
            initialIntervals={selectedEffective.intervals}
            initialLeaveReason={selectedEffective.leaveReason}
            onSuccess={handleRefresh}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Layer 3: WEEKLY ROUTINE SECTION                               */}
      {/* ------------------------------------------------------------- */}
      <WeeklyRoutineSection
        weeklyMap={weeklyMap}
        onOpenEditor={handleOpenWeeklyEditor}
        isReadOnly={isReadOnly}
      />

      {/* Weekly Routine Modal Dialog - Dentist/Admin Only */}
      {!isReadOnly && (
        <WeeklyRoutineDialog
          key={isWeeklyModalOpen ? "weekly-open" : "weekly-closed"}
          open={isWeeklyModalOpen}
          onOpenChange={setIsWeeklyModalOpen}
          practitionerId={practitionerId}
          initialRules={weeklyMap}
          focusedWeekday={focusedWeekday}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
