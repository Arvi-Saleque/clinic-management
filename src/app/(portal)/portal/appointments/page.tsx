import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, History, Plus, XCircle } from "lucide-react";

import { AppointmentCard } from "@/components/portal/appointment-card";
import { AppointmentSuccessToast } from "@/components/portal/appointment-success-toast";
import { ButtonLink } from "@/components/ui/button";
import { listOwnAppointments } from "@/lib/server/directory";

export const metadata: Metadata = { title: "My appointments" };

export default async function PortalAppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const [{ success }, appointments] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({ success: undefined }),
    listOwnAppointments(),
  ]);
  const now = new Date();
  const upcoming = appointments
    .filter((appointment) => !["completed", "cancelled", "no_show"].includes(appointment.status) && new Date(appointment.starts_at) > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const history = appointments.filter((appointment) => !upcoming.some((item) => item.id === appointment.id));
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled").length;

  const renderCard = (appointment: (typeof appointments)[number]) => (
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
    />
  );

  return (
    <div className="space-y-7">
      <AppointmentSuccessToast success={success} />
      <section className="flex flex-col gap-5 rounded-[28px] border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">My visits</p>
          <h1 className="mt-2 font-serif text-4xl">Appointments</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Review upcoming care, reschedule an available visit, or look back through your appointment history.</p>
        </div>
        <ButtonLink href="/portal/appointments/book" size="lg" className="gap-2"><Plus className="size-4" /> Book new visit</ButtonLink>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Upcoming", value: upcoming.length, icon: CalendarCheck, className: "bg-primary-soft text-primary" },
          { label: "Completed", value: completed, icon: CheckCircle2, className: "bg-success/10 text-success" },
          { label: "Cancelled", value: cancelled, icon: XCircle, className: "bg-destructive/10 text-destructive" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <span className={`flex size-11 items-center justify-center rounded-xl ${item.className}`}><item.icon className="size-5" /></span>
            <div><p className="text-2xl font-bold">{item.value}</p><p className="text-xs text-text-muted">{item.label} visits</p></div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <CalendarCheck className="size-5 text-primary" />
          <div><h2 className="font-heading text-xl font-bold">Upcoming care</h2><p className="text-xs text-text-muted">Confirmed and pending appointments</p></div>
        </div>
        {upcoming.length ? <div className="space-y-4">{upcoming.map(renderCard)}</div> : (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
            <CalendarCheck className="mx-auto size-9 text-text-muted" />
            <h3 className="mt-4 font-heading text-lg font-bold">No upcoming appointments</h3>
            <p className="mt-2 text-sm text-text-muted">Choose a service and a time that suits you.</p>
            <ButtonLink href="/portal/appointments/book" className="mt-5">Book an appointment</ButtonLink>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <History className="size-5 text-primary" />
            <div><h2 className="font-heading text-xl font-bold">Visit history</h2><p className="text-xs text-text-muted">Completed, past and cancelled appointments</p></div>
          </div>
          <div className="space-y-4">{history.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
