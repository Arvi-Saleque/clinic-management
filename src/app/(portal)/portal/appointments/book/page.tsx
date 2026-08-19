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
    <div className="mx-auto max-w-4xl py-2">
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
