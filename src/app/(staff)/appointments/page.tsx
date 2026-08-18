import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarCheck2 } from "lucide-react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { NewAppointmentDialog } from "@/components/staff/new-appointment-dialog";
import { AppointmentsWorkspace } from "@/components/staff/appointments-workspace";
import { getSchedulerContext } from "@/lib/server/appointments";
import { getPatientById, listAppointmentsForDay, listServices } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Appointments" };

export default async function StaffAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string; date?: string; patientId?: string }>;
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
  const [appointments, services, initialPatient] = await Promise.all([
    listAppointmentsForDay(activePractitioner.id, date),
    listServices(),
    params.patientId ? getPatientById(params.patientId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <CalendarCheck2 className="size-3.5" />
            Appointment workspace
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Appointments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View and manage bookings, arrivals and consultations in one focused workspace.
          </p>
        </div>

        <NewAppointmentDialog
          practitionerId={activePractitioner.id}
          branchId={activePractitioner.branch_id}
          date={date}
          services={services}
          initialPatient={initialPatient}
          defaultOpen={Boolean(initialPatient)}
        />
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
