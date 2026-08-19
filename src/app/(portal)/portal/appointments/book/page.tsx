import type { Metadata } from "next";

import { BookingWizard } from "@/components/portal/booking-wizard";
import { listServices } from "@/lib/server/directory";
import { getOwnAppointmentForReschedule } from "@/lib/server/patient-portal";

export const metadata: Metadata = { title: "Book an appointment" };

export default async function BookAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const { reschedule: rescheduleId } = await searchParams;
  const [services, appointment] = await Promise.all([
    listServices(),
    rescheduleId ? getOwnAppointmentForReschedule(rescheduleId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Appointment self-service</p>
        <h1 className="mt-2 font-serif text-4xl">{appointment ? "Choose a better time" : "Book an appointment"}</h1>
        <p className="mt-2 text-sm text-text-muted">Live availability is checked again before your booking is confirmed.</p>
      </div>
      <BookingWizard
        services={services}
        reschedule={appointment ? {
          id: appointment.id,
          startsAt: appointment.starts_at,
          serviceId: appointment.service_id,
          practitionerId: appointment.practitioner_id,
        } : null}
      />
    </div>
  );
}
