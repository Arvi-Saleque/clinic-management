import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, History, Plus, XCircle } from "lucide-react";

import { AppointmentCard, type PrescriptionSummary } from "@/components/portal/appointment-card";
import { AppointmentSuccessToast } from "@/components/portal/appointment-success-toast";
import { ButtonLink } from "@/components/ui/button";
import { listOwnAppointments, listOwnPrescriptions } from "@/lib/server/directory";

export const metadata: Metadata = { title: "My visits" };

export default async function PortalAppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const [{ success }, appointments, prescriptions] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({ success: undefined }),
    listOwnAppointments(),
    listOwnPrescriptions(),
  ]);

  const now = new Date();
  const upcoming = appointments
    .filter(
      (appointment) =>
        !["completed", "cancelled", "no_show"].includes(appointment.status) &&
        new Date(appointment.starts_at) > now,
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const history = appointments.filter(
    (appointment) => !upcoming.some((item) => item.id === appointment.id),
  );
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled").length;

  // Match prescription to appointment
  const findPrescriptionForAppointment = (
    appointment: (typeof appointments)[number],
  ): PrescriptionSummary | null => {
    // 1. Direct appointment_id match
    const directMatch = prescriptions.find(
      (rx) => (rx as unknown as { appointment_id?: string }).appointment_id === appointment.id,
    );
    if (directMatch) {
      return {
        id: directMatch.id,
        issued_at: directMatch.issued_at,
        status: directMatch.status,
        notes: directMatch.notes,
        practitionerName: directMatch.practitioners?.profiles?.full_name ?? undefined,
        prescription_items: directMatch.prescription_items ?? [],
      };
    }

    // 2. Date match fallback (same calendar day)
    const apptDateStr = new Date(appointment.starts_at).toISOString().slice(0, 10);
    const dateMatch = prescriptions.find((rx) => rx.issued_at?.slice(0, 10) === apptDateStr);
    if (dateMatch) {
      return {
        id: dateMatch.id,
        issued_at: dateMatch.issued_at,
        status: dateMatch.status,
        notes: dateMatch.notes,
        practitionerName: dateMatch.practitioners?.profiles?.full_name ?? undefined,
        prescription_items: dateMatch.prescription_items ?? [],
      };
    }

    return null;
  };

  const renderCard = (appointment: (typeof appointments)[number]) => {
    const rx = findPrescriptionForAppointment(appointment);
    return (
      <AppointmentCard
        key={appointment.id}
        id={appointment.id}
        starts_at={appointment.starts_at}
        ends_at={appointment.ends_at}
        status={appointment.status}
        notes={appointment.notes}
        practitionerName={appointment.practitioners?.profiles?.full_name ?? "Clinic practitioner"}
        serviceName={appointment.services?.name ?? "Dental visit"}
        price={appointment.services?.price ?? 0}
        duration={appointment.services?.duration_minutes}
        prescription={rx}
      />
    );
  };

  return (
    <div className="space-y-7">
      <AppointmentSuccessToast success={success} />
      <section className="flex flex-col gap-5 rounded-[28px] border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Care timeline</p>
          <h1 className="mt-2 font-serif text-4xl">My visits</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
            Review your upcoming care, access past visit records and prescriptions, or book a new appointment.
          </p>
        </div>
        <ButtonLink href="/portal/appointments/book" size="lg" className="gap-2">
          <Plus className="size-4" /> Book an appointment
        </ButtonLink>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Upcoming",
            value: upcoming.length,
            icon: CalendarCheck,
            className: "bg-primary-soft text-primary",
          },
          {
            label: "Completed",
            value: completed,
            icon: CheckCircle2,
            className: "bg-success/10 text-success",
          },
          {
            label: "Cancelled",
            value: cancelled,
            icon: XCircle,
            className: "bg-destructive/10 text-destructive",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <span className={`flex size-11 items-center justify-center rounded-xl ${item.className}`}>
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-text-muted">{item.label} visits</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <CalendarCheck className="size-5 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold">Upcoming care</h2>
            <p className="text-xs text-text-muted">Confirmed and pending visits</p>
          </div>
        </div>
        {upcoming.length ? (
          <div className="space-y-4">{upcoming.map(renderCard)}</div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
            <CalendarCheck className="mx-auto size-9 text-text-muted" />
            <h3 className="mt-4 font-heading text-lg font-bold">No upcoming visits</h3>
            <p className="mt-2 text-sm text-text-muted">Choose a service and a time that suits you.</p>
            <ButtonLink href="/portal/appointments/book" className="mt-5">
              Book an appointment
            </ButtonLink>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <History className="size-5 text-primary" />
            <div>
              <h2 className="font-heading text-xl font-bold">Visit history & prescriptions</h2>
              <p className="text-xs text-text-muted">
                Completed and past visits — click &quot;View Prescription&quot; to review prescribed medicines
              </p>
            </div>
          </div>
          <div className="space-y-4">{history.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
