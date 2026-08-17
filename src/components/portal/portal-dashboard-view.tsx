import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileHeart,
  HeartPulse,
  Pill,
  Receipt,
  ShieldCheck,
  Smile,
  Stethoscope,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppointmentSummary = {
  id: string;
  starts_at: string;
  status: string;
  serviceName: string;
  practitionerName: string;
};

type NotificationSummary = { id: string; type: string; created_at: string };

interface PortalDashboardViewProps {
  firstName: string;
  patientReference: string | null;
  registered: boolean;
  nextAppointment: AppointmentSummary | null;
  upcomingCount: number;
  completedCount: number;
  outstandingBalance: number;
  activePrescriptionCount: number;
  chartedTeeth: number;
  plannedTreatments: number;
  allergies: string[];
  conditions: string[];
  medications: string[];
  recentAppointments: AppointmentSummary[];
  notifications: NotificationSummary[];
}

const NOTIFICATION_LABEL: Record<string, string> = {
  booking_confirmation: "Your appointment was confirmed",
  reschedule_notice: "Your appointment time was updated",
  cancellation_notice: "An appointment was cancelled",
  reminder: "You have an upcoming visit",
};

function formatMoney(value: number) {
  return `৳${value.toLocaleString()}`;
}

function formatAppointment(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalDashboardView(props: PortalDashboardViewProps) {
  const alerts = [...props.allergies, ...props.conditions];

  if (!props.registered) {
    return (
      <section className="relative overflow-hidden rounded-[28px] bg-secondary px-6 py-10 text-secondary-foreground shadow-xl sm:px-10">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-white/10 text-white">Account created</Badge>
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Welcome, {props.firstName}.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">
            Complete your secure patient registration to book visits and unlock treatment, prescription and billing records.
          </p>
          <ButtonLink href="/portal/register" className="mt-7 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            Complete registration <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-secondary p-6 text-secondary-foreground shadow-xl shadow-secondary/10 sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-28 size-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 right-12 hidden h-40 w-40 rounded-t-full border border-white/10 lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/10 text-white">My care today</Badge>
              {props.patientReference && (
                <span className="text-xs font-semibold tracking-[0.16em] text-white/55">{props.patientReference}</span>
              )}
            </div>
            <h1 className="mt-5 font-serif text-4xl leading-none sm:text-5xl">Hello, {props.firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              Appointments, treatment notes, medicines and billing—in one private workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/portal/appointments/book" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <CalendarCheck className="size-4" /> Book a visit
              </ButtonLink>
              <ButtonLink href="/portal/appointments" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                View appointments
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Next appointment</p>
              <Clock3 className="size-4 text-accent" />
            </div>
            {props.nextAppointment ? (
              <>
                <p className="mt-4 text-lg font-semibold">{props.nextAppointment.serviceName}</p>
                <p className="mt-1 text-sm text-white/60">{formatAppointment(props.nextAppointment.starts_at)}</p>
                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-white/75">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/10"><Stethoscope className="size-4" /></span>
                  {props.nextAppointment.practitionerName}
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg font-semibold">No visit booked</p>
                <p className="mt-1 text-sm leading-5 text-white/60">Choose a service and an available time whenever you are ready.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Upcoming visits", value: props.upcomingCount, note: `${props.completedCount} visits completed`, icon: CalendarCheck, tone: "bg-primary-soft text-primary" },
          { label: "Active medicines", value: props.activePrescriptionCount, note: "From current prescriptions", icon: Pill, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
          { label: "Outstanding balance", value: formatMoney(props.outstandingBalance), note: props.outstandingBalance ? "Across open invoices" : "You are fully paid", icon: WalletCards, tone: "bg-warning/10 text-warning" },
          { label: "Charted teeth", value: props.chartedTeeth, note: `${props.plannedTreatments} planned treatments`, icon: Smile, tone: "bg-accent/15 text-primary" },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
              </div>
              <span className={cn("flex size-10 items-center justify-center rounded-xl", metric.tone)}>
                <metric.icon className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-text-muted">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Care journey</p>
              <h2 className="mt-1 font-heading text-xl font-bold">Recent and upcoming visits</h2>
            </div>
            <ButtonLink href="/portal/appointments" variant="ghost" size="sm" className="gap-1">All visits <ArrowRight className="size-3.5" /></ButtonLink>
          </div>
          <div className="mt-5 space-y-1">
            {props.recentAppointments.length ? props.recentAppointments.map((appointment, index) => (
              <div key={appointment.id} className="grid grid-cols-[28px_1fr_auto] gap-3 py-3">
                <div className="flex flex-col items-center">
                  <span className={cn("mt-1 size-2.5 rounded-full", index === 0 ? "bg-accent ring-4 ring-accent/15" : "bg-border")} />
                  {index < props.recentAppointments.length - 1 && <span className="mt-2 h-full w-px bg-border" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{appointment.serviceName}</p>
                  <p className="mt-1 text-xs text-text-muted">{formatAppointment(appointment.starts_at)} · {appointment.practitionerName}</p>
                </div>
                <Badge variant="outline" className="h-fit capitalize">{appointment.status.replace("_", " ")}</Badge>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center">
                <CalendarCheck className="mx-auto size-7 text-text-muted" />
                <p className="mt-3 text-sm font-semibold">No visit history yet</p>
                <p className="mt-1 text-xs text-text-muted">Your clinical journey will appear here after booking.</p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><FileHeart className="size-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Clinical safety</p>
              <h2 className="font-heading text-lg font-bold">Health alerts</h2>
            </div>
          </div>
          {alerts.length ? (
            <div className="mt-5 space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert} className="flex items-center gap-2 rounded-xl bg-destructive/5 px-3 py-2 text-sm"><AlertTriangle className="size-4 shrink-0 text-destructive" /> {alert}</div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-success/8 p-4"><CheckCircle2 className="size-5 text-success" /><p className="text-sm">No allergies or chronic conditions recorded.</p></div>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold text-text-muted">Current medicines</p>
            <p className="mt-1 text-sm">{props.medications.length ? props.medications.join(", ") : "None recorded"}</p>
          </div>
          <ButtonLink href="/portal/profile" variant="outline" className="mt-5 w-full gap-2">Review health profile <ArrowRight className="size-4" /></ButtonLink>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          { href: "/portal/odontogram", icon: Smile, title: "Treatment & dental chart", text: props.plannedTreatments ? `${props.plannedTreatments} treatment items are planned or under review.` : "See your tooth-by-tooth care record and treatment recommendations." },
          { href: "/portal/prescriptions", icon: Pill, title: "Medicines & instructions", text: props.activePrescriptionCount ? `${props.activePrescriptionCount} medicines are listed in your current records.` : "Review medicines, dosage, frequency and clinical instructions." },
          { href: "/portal/invoices", icon: Receipt, title: "Invoices & payments", text: props.outstandingBalance ? `${formatMoney(props.outstandingBalance)} remains across your open invoices.` : "Your current account has no outstanding balance." },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform group-hover:scale-105"><item.icon className="size-5" /></span>
            <h3 className="mt-5 font-heading text-lg font-bold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-muted">{item.text}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open record <ArrowRight className="size-4" /></span>
          </Link>
        ))}
      </section>

      {props.notifications.length > 0 && (
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Bell className="size-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Updates</p><h2 className="font-heading text-lg font-bold">Recent notifications</h2></div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {props.notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 rounded-2xl border border-border p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                <div><p className="text-sm font-medium">{NOTIFICATION_LABEL[notification.type] ?? notification.type}</p><p className="mt-1 text-xs text-text-muted">{new Date(notification.created_at).toLocaleDateString()}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-primary-soft/55 p-4 text-sm text-primary">
        <HeartPulse className="size-5 shrink-0" />
        <p><strong>Important:</strong> For severe pain, swelling, bleeding or another urgent concern, contact the clinic directly.</p>
      </div>
    </div>
  );
}
