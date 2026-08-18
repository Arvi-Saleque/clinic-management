import type { Metadata } from "next";
import { addDays, format } from "date-fns";
import { CalendarClock, CalendarDays, CheckCircle2, Clock3, ShieldCheck, UserCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ComingSoon } from "@/components/shared/coming-soon";
import { SchedulerToolbar } from "@/components/staff/scheduler-toolbar";
import { AppointmentList } from "@/components/staff/appointment-list";
import { NewAppointmentDialog } from "@/components/staff/new-appointment-dialog";
import { AvailabilityPlanner } from "@/components/staff/availability-planner";
import { DailyScheduleBoard } from "@/components/staff/daily-schedule-board";
import {
  getSchedulerContext,
  listAvailabilityRules,
  listAvailabilityExceptions,
  getPractitionerAppointmentCountsForRange,
} from "@/lib/server/appointments";
import { getPatientById, listAppointmentsForDay, listServices } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Scheduler" };

export default async function StaffSchedulerPage({ searchParams }: { searchParams: Promise<{ practitioner?: string; date?: string; patientId?: string }> }) {
  const params = await searchParams;
  const context = await getSchedulerContext(params.practitioner);
  const activePractitioner = context.activePractitioner;

  if (!activePractitioner) {
    return <ComingSoon title="Practitioner profile required" description="Connect this staff account to a practitioner profile before the clinical diary can be used." />;
  }

  const date = params.date ?? format(new Date(), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayPlus30Str = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const [services, appointments, rules, exceptions, appointmentCounts, initialPatient] =
    await Promise.all([
      listServices(),
      listAppointmentsForDay(activePractitioner.id, date),
      listAvailabilityRules(activePractitioner.id),
      listAvailabilityExceptions(activePractitioner.id, todayStr, 30),
      getPractitionerAppointmentCountsForRange(activePractitioner.id, todayStr, todayPlus30Str),
      params.patientId ? getPatientById(params.patientId) : Promise.resolve(null),
    ]);
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const checkedIn = appointments.filter((appointment) => appointment.status === "checked_in").length;
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><CalendarClock className="size-3.5" />Role-scoped scheduling</div>
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">{context.canSelectPractitioner ? "Clinical diary" : "My clinical diary"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage appointments in a visual time chart. Dentists only see and manage their own availability and diary.</p>
        </div>
        <NewAppointmentDialog practitionerId={activePractitioner.id} branchId={activePractitioner.branch_id} date={date} services={services} initialPatient={initialPatient} defaultOpen={Boolean(initialPatient)} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total visits", value: appointments.length, icon: CalendarDays, tone: "bg-primary-soft text-primary" },
          { label: "Confirmed", value: confirmed, icon: UserCheck, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
          { label: "Checked in", value: checkedIn, icon: Clock3, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
          { label: "Completed", value: completed, icon: CheckCircle2, tone: "bg-success/10 text-success" },
        ].map((item) => <article key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"><span className={`flex size-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="size-[18px]" /></span><div><p className="font-heading text-2xl font-extrabold">{item.value}</p><p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p></div></article>)}
      </section>

      <Card className="rounded-2xl p-4"><SchedulerToolbar practitioners={context.practitioners} practitionerId={activePractitioner.id} date={date} canSelectPractitioner={context.canSelectPractitioner} /></Card>

      <DailyScheduleBoard appointments={appointments} />

      <section className="space-y-5">
        <AvailabilityPlanner
          key={activePractitioner.id}
          practitionerId={activePractitioner.id}
          branchId={activePractitioner.branch_id}
          rules={rules}
          exceptions={exceptions}
          appointmentCounts={appointmentCounts}
        />
        <article className="rounded-3xl border border-primary/12 bg-secondary p-6 text-secondary-foreground">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Availability is explicit</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-white/65">
                  A time is bookable only when it falls inside an enabled weekly window and has no exception or overlapping appointment. Disabled days and all time outside the saved windows remain unavailable.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/80 border-t border-white/10 pt-3 lg:border-t-0 lg:pt-0">
              <span>• Doctor accounts locked to own diary</span>
              <span>• Double-booking rejected by DB</span>
              <span>• Unified slot engine</span>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4"><h2 className="font-heading text-lg font-extrabold">Appointment actions</h2><p className="mt-1 text-xs text-muted-foreground">Confirm arrival, check in, complete a visit or record cancellation/no-show status.</p></div>
        <AppointmentList appointments={appointments} />
      </section>
    </div>
  );
}
