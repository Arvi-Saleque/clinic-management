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
    <div className="mx-auto max-w-4xl space-y-7">
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/85 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        {/* Soft Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-60 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/80 px-3 py-0.5 text-xs font-semibold text-primary backdrop-blur-md">
            Appointment self-service
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {appointment ? "Choose a better time" : "Book an appointment"}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
            Live availability is checked again before your booking is confirmed.
          </p>
        </div>
      </section>

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
