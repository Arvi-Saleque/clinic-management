import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, History, Plus, XCircle } from "lucide-react";

import { AppointmentCard, type PrescriptionSummary } from "@/components/portal/appointment-card";
import { AppointmentSuccessToast } from "@/components/portal/appointment-success-toast";
import { ButtonLink } from "@/components/ui/button";
import { listOwnAppointments, listOwnPrescriptions } from "@/lib/server/directory";
import { cn } from "@/lib/utils";
import { PortalHistoryList, type PortalAppointmentHistoryItem } from "@/components/portal/portal-history-list";

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

  const formattedHistory: PortalAppointmentHistoryItem[] = history.map((appointment) => ({
    id: appointment.id,
    starts_at: appointment.starts_at,
    ends_at: appointment.ends_at,
    status: appointment.status,
    notes: appointment.notes,
    practitionerName: appointment.practitioners?.profiles?.full_name ?? "Clinic practitioner",
    serviceName: appointment.services?.name ?? "Dental visit",
    price: appointment.services?.price ?? 0,
    duration: appointment.services?.duration_minutes,
    prescription: findPrescriptionForAppointment(appointment),
  }));

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
    <div className="space-y-8">
      <AppointmentSuccessToast success={success} />
      
      {/* ── HEADER BANNER ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/85 backdrop-blur-xl p-6 sm:p-8 shadow-sm transition-all sm:flex sm:items-end sm:justify-between sm:gap-6">
        {/* Soft Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/60 px-3 py-1 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Patient Care Hub
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            My appointments
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Manage your scheduled clinic visits, track consultation notes, and review prescribed medications.
          </p>
        </div>

        <div className="mt-6 sm:mt-0 relative z-10 shrink-0">
          <ButtonLink
            href="/portal/appointments/book"
            size="lg"
            className="w-full sm:w-auto rounded-2xl px-6 h-12 font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="size-4 mr-2" />
            Book a Visit
          </ButtonLink>
        </div>
      </section>

      {/* ── STATS OVERVIEW CARDS ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Upcoming",
            value: upcoming.length,
            icon: CalendarCheck,
            className: "bg-primary-soft text-primary",
            border: "hover:border-primary/40",
          },
          {
            label: "Completed",
            value: completed,
            icon: CheckCircle2,
            className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            border: "hover:border-emerald-500/40",
          },
          {
            label: "Cancelled",
            value: cancelled,
            icon: XCircle,
            className: "bg-destructive/10 text-destructive",
            border: "hover:border-destructive/40",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-4.5 rounded-[24px] border border-border/80 bg-surface/85 backdrop-blur-xl p-5 shadow-xs transition-all hover:scale-[1.01] hover:shadow-md",
              item.border,
            )}
          >
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${item.className}`}>
              <item.icon className="size-6" />
            </span>
            <div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                {item.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {item.label} visits
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── UPCOMING VISITS SECTION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <CalendarCheck className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Upcoming care</h2>
            <p className="text-xs text-text-muted">Confirmed and pending visits</p>
          </div>
        </div>
        {upcoming.length ? (
          <div className="space-y-4">{upcoming.map(renderCard)}</div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-border/80 bg-surface/85 backdrop-blur-xl p-12 text-center space-y-3 shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft/60 text-primary mx-auto">
              <CalendarCheck className="size-7" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">No upcoming visits</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              Choose your preferred doctor, treatment service, and time that fits your schedule.
            </p>
            <div className="pt-2">
              <ButtonLink href="/portal/appointments/book" className="rounded-2xl px-6 h-10 font-bold text-xs">
                Book an appointment
              </ButtonLink>
            </div>
          </div>
        )}
      </section>

      {/* ── VISIT HISTORY & PRESCRIPTIONS ── */}
      {formattedHistory.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <History className="size-4.5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Visit history &amp; prescriptions</h2>
              <p className="text-xs text-text-muted">
                Completed and past visits &mdash; click &ldquo;View Prescription&rdquo; to review prescribed medicines
              </p>
            </div>
          </div>
          <PortalHistoryList history={formattedHistory} />
        </section>
      )}
    </div>
  );
}
