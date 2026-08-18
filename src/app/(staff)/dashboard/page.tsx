import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, CalendarCheck2, ChevronRight, FileText, Plus, Receipt, Sparkles, Stethoscope, UserCheck, Users, WalletCards, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConsultationActionButton } from "@/components/clinical/consultation-action-button";
import { getProfile } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/server/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/12 text-warning border-warning/20",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
  checked_in: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
  completed: "bg-success/10 text-success border-success/20",
};

function getGreetingDisplayName(fullName?: string | null): string {
  if (!fullName) return "";
  const cleaned = fullName.replace(/\s*\([^)]*\)/g, "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length > 1 && /^(dr\.?|mr\.?|ms\.?|mrs\.?|prof\.?)/i.test(parts[0])) {
    const title = parts[0].endsWith(".") ? parts[0] : `${parts[0]}.`;
    return `${title} ${parts[1]}`;
  }
  return parts[0];
}

export default async function StaffDashboardPage() {
  const [profile, stats] = await Promise.all([getProfile(), getDashboardStats()]);
  const maxActivity = Math.max(...stats.activity.map((day) => day.count), 1);
  const nextAppointment = stats.todaysSchedule.find((appointment) => new Date(appointment.starts_at) >= new Date());
  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";
  const displayName = getGreetingDisplayName(profile?.full_name);

  const metrics = [
    { label: stats.practitionerScoped ? "My appointments" : "Today’s appointments", value: stats.todaysAppointments, note: `${stats.completedAppointments} completed · ${stats.checkedInPatients} checked in`, icon: CalendarCheck2, tone: "bg-primary-soft text-primary", href: "/scheduler" },
    { label: "Active patients", value: stats.totalPatients, note: `+${stats.newPatientsThisMonth} registered this month`, icon: Users, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300", href: "/patients" },
    { label: "Outstanding balance", value: `৳${stats.outstandingAmount.toLocaleString()}`, note: `${stats.outstandingInvoiceCount} open invoices`, icon: WalletCards, tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300", href: "/billing/invoices" },
    { label: "Next 7 days", value: stats.upcomingSevenDays, note: "Confirmed and pending visits", icon: UserCheck, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300", href: "/scheduler" },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-secondary p-6 text-secondary-foreground shadow-[0_28px_70px_-48px_rgba(5,40,38,0.85)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 size-36 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">
              <Sparkles className="size-3.5 text-accent" />{format(new Date(), "EEEE, d MMMM")}
            </div>
            <h1 className="max-w-2xl font-heading text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-[38px] sm:leading-[1.12]">
              Good {greeting}{displayName ? `, ${displayName}` : ""}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Your clinic is organised for today. Review the diary, open a patient record or complete clinical documentation from one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/patients" variant="outline" size="lg" className="h-11 gap-2 border-white/15 bg-white/8 px-4 text-white hover:bg-white/14 hover:text-white"><Users className="size-4" />Find patient</ButtonLink>
            <ButtonLink href="/scheduler" size="lg" className="h-11 gap-2 bg-accent px-4 text-accent-foreground hover:bg-accent/90"><Plus className="size-4" />New appointment</ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Clinic summary">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="group rounded-2xl border border-border bg-surface p-5 shadow-[0_14px_38px_-32px_rgba(9,47,44,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25">
            <div className="flex items-start justify-between"><span className={cn("flex size-10 items-center justify-center rounded-xl", metric.tone)}><metric.icon className="size-[18px]" /></span><ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" /></div>
            <p className="mt-5 text-xs font-semibold text-muted-foreground">{metric.label}</p>
            <p className="mt-1 font-heading text-[28px] font-extrabold tracking-[-0.035em]">{metric.value}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{metric.note}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_52px_-42px_rgba(9,47,44,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div><h2 className="font-heading text-lg font-extrabold tracking-tight">Today’s clinical diary</h2><p className="mt-1 text-xs text-muted-foreground">Patient, treatment, timing and live visit status.</p></div>
            <ButtonLink href="/scheduler" variant="outline" size="sm" className="gap-1.5">Open full diary<ChevronRight className="size-3.5" /></ButtonLink>
          </div>
          {stats.todaysSchedule.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><CalendarCheck2 className="size-5" /></span><p className="mt-4 text-sm font-bold">No appointments scheduled today</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Set your availability or create an appointment to start today’s diary.</p></div>
          ) : (
            <div className="divide-y divide-border">
              {stats.todaysSchedule.slice(0, 7).map((appointment) => (
                <div key={appointment.id} className="group grid gap-3 px-5 py-4 transition hover:bg-muted/55 sm:grid-cols-[74px_1fr_auto] sm:items-center sm:px-6">
                  <div>
                    <p className="font-heading text-base font-extrabold">{format(new Date(appointment.starts_at), "HH:mm")}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{appointment.services?.duration_minutes ?? 30} min</p>
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/patients/${appointment.patients?.id ?? ""}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-[10px] font-extrabold text-primary hover:opacity-80"
                    >
                      {appointment.patients ? `${appointment.patients.first_name[0]}${appointment.patients.last_name[0]}` : "PT"}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/patients/${appointment.patients?.id ?? ""}`}
                        className="truncate text-sm font-bold text-foreground hover:text-primary hover:underline block"
                      >
                        {appointment.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : "Patient"}
                      </Link>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {appointment.services?.name ?? "Dental consultation"} · {appointment.practitioners?.profiles?.full_name ?? "Practitioner"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("w-fit capitalize", STATUS_STYLE[appointment.status])}>
                      {appointment.status.replace("_", " ")}
                    </Badge>
                    <ConsultationActionButton
                      appointmentId={appointment.id}
                      status={appointment.status}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <div className="grid gap-5">
          <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_52px_-42px_rgba(9,47,44,0.55)] sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="font-heading text-lg font-extrabold tracking-tight">7-day activity</h2><p className="mt-1 text-xs text-muted-foreground">Appointment volume by day</p></div><span className="rounded-xl bg-primary-soft px-2.5 py-1.5 text-[10px] font-bold text-primary">Live diary</span></div>
            <div className="mt-7 flex h-36 items-end justify-between gap-2" aria-label="Appointment activity bar chart">
              {stats.activity.map((day) => <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-muted-foreground">{day.count}</span><div className="group relative flex h-[104px] w-full max-w-8 items-end overflow-hidden rounded-full bg-muted"><div className="w-full rounded-full bg-gradient-to-t from-primary to-accent transition-all duration-500 group-hover:brightness-110" style={{ height: `${Math.max(8, (day.count / maxActivity) * 100)}%` }} /></div><span className="text-[10px] font-semibold text-muted-foreground">{day.label}</span></div>)}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_52px_-42px_rgba(9,47,44,0.55)] sm:p-6">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success"><Clock3 className="size-[18px]" /></span><div><h2 className="text-sm font-extrabold">Next in the diary</h2><p className="text-[11px] text-muted-foreground">Prepare before the patient arrives</p></div></div>
            {nextAppointment ? (
              <div className="mt-5 rounded-2xl border border-primary/10 bg-primary-soft/45 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">
                      {nextAppointment.patients ? `${nextAppointment.patients.first_name} ${nextAppointment.patients.last_name}` : "Patient"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {nextAppointment.services?.name ?? "Dental consultation"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-extrabold text-primary-foreground">
                    {format(new Date(nextAppointment.starts_at), "HH:mm")}
                  </span>
                </div>

                <div className="pt-1">
                  <ConsultationActionButton
                    appointmentId={nextAppointment.id}
                    status={nextAppointment.status}
                    size="sm"
                    className="w-full"
                  />
                </div>

                <Link href={`/patients/${nextAppointment.patients?.id ?? ""}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  Open patient record<ChevronRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-muted p-4 text-xs leading-5 text-muted-foreground">No more appointments today.</p>
            )}
          </article>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/clinical/prescriptions/new", icon: FileText, title: "Document prescription", text: "Record medicines, dosage, frequency and patient instructions." },
          { href: "/billing/invoices/new", icon: Receipt, title: "Create patient invoice", text: "Itemise treatment charges and set a clear payment due date." },
          { href: "/clinical/odontogram", icon: Stethoscope, title: "Update dental chart", text: "Record tooth condition, planned care and clinical history." },
        ].map((action) => <Link key={action.href} href={action.href} className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/25"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-primary-soft group-hover:text-primary"><action.icon className="size-[18px]" /></span><div><h3 className="text-sm font-extrabold">{action.title}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{action.text}</p></div></Link>)}
      </section>
    </div>
  );
}
