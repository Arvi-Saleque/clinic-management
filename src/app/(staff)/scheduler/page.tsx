import type { Metadata } from "next";
import { addDays, format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { AvailabilityPlanner } from "@/components/staff/availability-planner";
import { PractitionerSchedulerSelector } from "@/components/staff/availability/practitioner-scheduler-selector";
import { requireStaff } from "@/lib/auth/guards";
import {
  getSchedulerContext,
  listAvailabilityRules,
  listAvailabilityExceptions,
  getPractitionerAppointmentCountsForRange,
} from "@/lib/server/appointments";

export const metadata: Metadata = { title: "Availability & Diary" };

export default async function StaffSchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string }>;
}) {
  const profile = await requireStaff();
  const params = await searchParams;
  const context = await getSchedulerContext(params.practitioner);
  const activePractitioner = context.activePractitioner;

  if (!activePractitioner) {
    return (
      <ComingSoon
        title="Practitioner profile required"
        description="Connect this staff account to a practitioner profile before the clinical diary can be used."
      />
    );
  }

  const today = new Date();
  const startRangeStr = format(addDays(today, -30), "yyyy-MM-dd");
  const endRangeStr = format(addDays(today, 90), "yyyy-MM-dd");

  const [rules, exceptions, appointmentCounts] =
    await Promise.all([
      listAvailabilityRules(activePractitioner.id),
      listAvailabilityExceptions(activePractitioner.id, startRangeStr, 120),
      getPractitionerAppointmentCountsForRange(activePractitioner.id, startRangeStr, endRangeStr),
    ]);

  const isReceptionist = profile.role === "receptionist";

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-primary border border-primary/20 shadow-2xs">
              <CalendarDays className="size-3 text-primary" />
              Clinical Diary &amp; Working Hours
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Availability &amp; Diary
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage and modify clinical hours, daily schedules, and availability for any selected doctor.
          </p>
        </div>

        {context.canSelectPractitioner && (
          <div className="flex flex-wrap items-center gap-3">
            <PractitionerSchedulerSelector
              practitioners={context.practitioners}
              currentPractitionerId={activePractitioner.id}
            />
          </div>
        )}
      </div>

      {/* 2. Main Availability 3-Layer Workspace */}
      <AvailabilityPlanner
        key={activePractitioner.id}
        practitionerId={activePractitioner.id}
        branchId={activePractitioner.branch_id}
        rules={rules}
        exceptions={exceptions}
        appointmentCounts={appointmentCounts}
        userRole={profile.role}
      />
    </div>
  );
}
