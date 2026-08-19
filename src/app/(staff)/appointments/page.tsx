import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarCheck2 } from "lucide-react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { AppointmentsWorkspace } from "@/components/staff/appointments-workspace";
import { getSchedulerContext } from "@/lib/server/appointments";
import { listAppointmentsForDay } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Appointments" };

export default async function StaffAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string; date?: string }>;
}) {
  const params = await searchParams;
  const context = await getSchedulerContext(params.practitioner);
  const activePractitioner = context.activePractitioner;

  if (!activePractitioner) {
    return (
      <ComingSoon
        title="Practitioner profile required"
        description="Connect this staff account to a practitioner profile before appointments can be viewed."
      />
    );
  }

  const date = params.date ?? format(new Date(), "yyyy-MM-dd");
  const appointments = await listAppointmentsForDay(activePractitioner.id, date);

  return (
    <div className="space-y-5 w-full pb-12">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <CalendarCheck2 className="size-3.5" />
            Appointment workspace
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Appointments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            View and manage bookings, arrivals and consultations in one focused workspace.
          </p>
        </div>
      </div>

      <AppointmentsWorkspace
        appointments={appointments}
        practitioners={context.practitioners}
        practitionerId={activePractitioner.id}
        date={date}
        canSelectPractitioner={context.canSelectPractitioner}
      />
    </div>
  );
}
