"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  RotateCw,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  const [activeTab, setActiveTab] = React.useState<string>("calendar");

  // Transform database rules into weekly map for template editor
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
            Practitioner Availability
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Manage upcoming working hours, date-specific overrides, and your recurring weekly
            template. Changes immediately update patient online booking and staff scheduling grids.
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

      {/* Primary Availability Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="calendar"
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              Next 30 Days
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-1.5"
            >
              <CalendarRange className="w-3.5 h-3.5 text-muted-foreground" />
              Weekly Template
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Next 30 Days Operational Calendar (Default View) */}
        <TabsContent value="calendar" className="mt-0 focus-visible:outline-none">
          <AvailabilityCalendarView
            days={thirtyDays}
            practitionerId={practitionerId}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        {/* Tab 2: Recurring Weekly Template (Secondary Base View) */}
        <TabsContent value="weekly" className="mt-0 focus-visible:outline-none">
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
            <WeeklyTemplateView
              branchId={branchId}
              practitionerId={practitionerId}
              initialRules={weeklyMap}
              onSuccess={handleRefresh}
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
