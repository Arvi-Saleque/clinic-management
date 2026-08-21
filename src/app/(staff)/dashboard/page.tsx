import type { Metadata } from "next";
import Link from "next/link";
import {
  differenceInMinutes,
  differenceInYears,
  format,
} from "date-fns";
import {
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  ExternalLink,
  Loader2,
  Phone,
  Sparkles,
  Stethoscope,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ConsultationActionButton } from "@/components/clinical/consultation-action-button";
import { ReceptionistDashboard } from "@/components/staff/receptionist-dashboard";
import { requireStaff } from "@/lib/auth/guards";
import {
  getDashboardStats,
  getReceptionistDashboardContext,
} from "@/lib/server/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard | Dental Workspace" };

export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string }>;
}) {
  const profile = await requireStaff();

  // Role Routing: Receptionist gets the dedicated minimal operational dashboard
  if (profile.role === "receptionist") {
    const params = await searchParams;
    const context = await getReceptionistDashboardContext(params.practitioner);
    return <ReceptionistDashboard context={context} />;
  }

  // Dentists & Owner Admins preserve their clinician dashboard
  const stats = await getDashboardStats();
  const {
    nextAppointment,
    upcomingAppointmentsList,
    completedAppointmentsList,
    completedCount,
    inProgressCount,
    upcomingCount,
    cancelledNoShowCount,
  } = stats;

  const now = new Date();

  // Next appointment time relative string (e.g. "In 18 min", "Starting soon", "In progress", "Confirmed")
  let nextRelativeTime = "Scheduled today";
  if (nextAppointment) {
    const apptDate = new Date(nextAppointment.starts_at);
    const diffMins = differenceInMinutes(apptDate, now);
    if (diffMins > 0 && diffMins <= 60) {
      nextRelativeTime = `In ${diffMins} min`;
    } else if (diffMins > 60 && diffMins <= 180) {
      nextRelativeTime = `In ~${Math.round(diffMins / 60)} hrs`;
    } else if (diffMins <= 0 && diffMins >= -30) {
      nextRelativeTime = "In progress";
    } else if (diffMins < -30) {
      nextRelativeTime = "Past scheduled time";
    } else {
      nextRelativeTime = "Confirmed on schedule";
    }
  }

  // Next appointment patient details
  const nextPatient = nextAppointment?.patients;
  const nextPatientName = nextPatient
    ? `${nextPatient.first_name} ${nextPatient.last_name}`
    : "Patient";
  const isNewPatient =
    nextPatient?.created_at &&
    differenceInYears(now, new Date(nextPatient.created_at)) === 0 &&
    new Date(nextPatient.created_at).toDateString() === now.toDateString();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full max-w-[1600px] pb-12">
      {/* ============================================================= */}
      {/* LEFT COLUMN (8 cols): Hero Banner + Upcoming Appointments     */}
      {/* ============================================================= */}
      <div className="xl:col-span-8 space-y-6 min-w-0">
        {/* 1. HERO BANNER: NEXT APPOINTMENT */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062420] via-[#093530] to-[#0B3B36] border border-emerald-500/20 p-6 sm:p-7 text-white shadow-xl">
          {/* Subtle ambient lighting / watermark */}
          <div className="pointer-events-none absolute -right-6 -bottom-10 size-80 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -top-10 size-60 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.05] hidden sm:block">
            <svg viewBox="0 0 200 200" className="size-64 fill-white">
              <path d="M100 20C70 20 50 40 50 70C50 100 65 140 80 180C85 195 95 195 100 175C105 195 115 195 120 180C135 140 150 100 150 70C150 40 130 20 100 20Z" />
            </svg>
          </div>

          <div className="relative space-y-5">
            {/* Top Badge Strip */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 border border-white/10 backdrop-blur-md shadow-2xs">
                <Sparkles className="size-3 text-emerald-400" />
                Next Appointment
              </span>

              {nextAppointment && (
                <span className="text-[11px] font-bold text-emerald-200/70 font-mono">
                  {format(new Date(nextAppointment.starts_at), "EEEE, dd MMMM")}
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-5">
                {/* Patient Header Block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Patient Avatar Capsule */}
                    <div className="size-16 sm:size-18 rounded-2xl border-2 border-emerald-400/30 bg-emerald-950/90 flex items-center justify-center text-lg sm:text-xl font-black text-emerald-200 shadow-md shrink-0 backdrop-blur-xs">
                      {nextPatient ? `${nextPatient.first_name[0]}${nextPatient.last_name[0]}` : "PT"}
                    </div>

                    {/* Name + Badge */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {nextPatientName}
                        </h2>
                        <span className="rounded-full bg-white/10 text-emerald-200 border border-white/15 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs shadow-2xs">
                          {isNewPatient ? "New patient" : "Returning patient"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-200/80 font-mono">
                        {nextPatient?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-emerald-400" />
                            {nextPatient.phone}
                          </span>
                        )}
                        {nextPatient?.id && (
                          <>
                            <span>&bull;</span>
                            <span className="text-emerald-300/70">PT-{nextPatient.id.slice(0, 4).toUpperCase()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4-Metric Glass Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {/* Metric 1: Time */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-2xs hover:bg-white/[0.09] transition-all space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300/80">
                      <Clock className="size-3.5 text-emerald-400" />
                      <span>Time</span>
                    </div>
                    <p className="font-heading text-lg font-black text-white tracking-tight">
                      {format(new Date(nextAppointment.starts_at), "hh:mm a")}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-300/90 truncate">
                      {nextRelativeTime}
                    </p>
                  </div>

                  {/* Metric 2: Service */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-2xs hover:bg-white/[0.09] transition-all space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300/80">
                      <Stethoscope className="size-3.5 text-emerald-400" />
                      <span>Service</span>
                    </div>
                    <p className="font-bold text-sm text-white truncate">
                      {nextAppointment.services?.name ?? "Dental Consultation"}
                    </p>
                    <p className="text-[11px] text-emerald-200/60 truncate font-medium">
                      {nextAppointment.notes || "Standard care"}
                    </p>
                  </div>

                  {/* Metric 3: Duration */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-2xs hover:bg-white/[0.09] transition-all space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300/80">
                      <Clock3 className="size-3.5 text-emerald-400" />
                      <span>Duration</span>
                    </div>
                    <p className="font-heading text-lg font-black text-white tracking-tight">
                      {nextAppointment.services?.duration_minutes ?? 30} min
                    </p>
                    <p className="text-[11px] text-emerald-200/60 truncate font-medium">
                      Standard slot
                    </p>
                  </div>

                  {/* Metric 4: Location */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-2xs hover:bg-white/[0.09] transition-all space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300/80">
                      <Building2 className="size-3.5 text-emerald-400" />
                      <span>Location</span>
                    </div>
                    <p className="font-bold text-sm text-white truncate">
                      {nextAppointment.branches?.name || "Main Branch"}
                    </p>
                    <p className="text-[11px] text-emerald-200/60 truncate font-medium">
                      Operatory room
                    </p>
                  </div>
                </div>

                {/* Bottom Action CTAs */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <ButtonLink
                    href="/appointments"
                    variant="ghost"
                    className="h-10 px-4 rounded-xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 backdrop-blur-md gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
                  >
                    <span>View appointment</span>
                    <ExternalLink className="size-3.5" />
                  </ButtonLink>

                  <ConsultationActionButton
                    appointmentId={nextAppointment.id}
                    status={nextAppointment.status}
                    size="sm"
                    className="h-10 px-5 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-[#062420] font-black text-xs shadow-md shadow-[#14b8a6]/20 transition-all hover:scale-[1.02]"
                  />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-emerald-300 border border-white/15">
                  <CheckCircle2 className="size-6" />
                </div>
                <p className="font-heading text-lg font-extrabold text-white">
                  No more appointments scheduled for today
                </p>
                <p className="text-xs text-emerald-200/70 max-w-sm mx-auto">
                  You are all caught up for the day. Check your schedule or book incoming patients.
                </p>
                <div className="pt-2">
                  <ButtonLink
                    href="/scheduler"
                    variant="ghost"
                    className="h-9 px-4 rounded-xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 backdrop-blur-md"
                  >
                    Open Full Scheduler
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. CARD: TODAY'S UPCOMING APPOINTMENTS */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-2xs">
                <Calendar className="size-4.5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-foreground">
                  Today&apos;s upcoming appointments
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Queue of pending patient consultations for today
                </p>
              </div>
            </div>

            <Link
              href="/appointments"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View full schedule</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* List of Upcoming Items */}
          {upcomingAppointmentsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                No upcoming appointments remaining today.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAppointmentsList.map((appt) => {
                const patient = appt.patients;
                const patientName = patient
                  ? `${patient.first_name} ${patient.last_name}`
                  : "Patient";

                return (
                  <Link
                    key={appt.id}
                    href={`/patients/${patient?.id ?? ""}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-border/90 transition-all shadow-2xs"
                  >
                    {/* Time & Timeline Badge */}
                    <div className="flex items-center gap-3 w-32 shrink-0">
                      <span className="font-mono text-xs font-black bg-card px-2.5 py-1 rounded-xl border border-border/70 text-foreground shadow-2xs">
                        {format(new Date(appt.starts_at), "hh:mm a")}
                      </span>
                    </div>

                    {/* Patient Name */}
                    <div className="min-w-0 w-48 shrink-0">
                      <span className="font-heading text-xs font-extrabold text-foreground group-hover:text-primary truncate block transition-colors">
                        {patientName}
                      </span>
                    </div>

                    {/* Service & Tooth/Notes */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground truncate">
                        {appt.services?.name ?? "Dental Check-up"}
                      </p>
                    </div>

                    {/* Duration & Action Chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-muted-foreground bg-card px-2.5 py-1 rounded-xl border border-border/60 shadow-2xs">
                        {appt.services?.duration_minutes ?? 30} min
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer Count */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
            <CalendarDays className="size-3.5 text-primary" />
            <span>{upcomingAppointmentsList.length} appointment{upcomingAppointmentsList.length === 1 ? "" : "s"} remaining today</span>
          </div>
        </section>
      </div>

      {/* ============================================================= */}
      {/* RIGHT COLUMN (4 cols): Progress + Completed                   */}
      {/* ============================================================= */}
      <aside className="xl:col-span-4 space-y-6">
        {/* 3. CARD: TODAY'S PROGRESS */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
            <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 shrink-0 shadow-2xs">
              <TrendingUp className="size-4.5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-extrabold text-foreground">
                Today&apos;s progress
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Live consultation overview
              </p>
            </div>
          </div>

          {/* 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: Completed */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 space-y-2 shadow-2xs hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 transition-all">
              <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
                <Check className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Completed
                </p>
                <p className="font-heading text-2xl font-black text-foreground tracking-tight">
                  {completedCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/80">
                  {completedCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 2: In Progress */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-3.5 space-y-2 shadow-2xs hover:bg-sky-500/[0.08] hover:border-sky-500/30 transition-all">
              <div className="size-8 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center border border-sky-500/20 shadow-2xs">
                <Loader2 className={cn("size-4 stroke-[2.5]", inProgressCount > 0 && "animate-spin")} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  In progress
                </p>
                <p className="font-heading text-2xl font-black text-foreground tracking-tight">
                  {inProgressCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/80">
                  {inProgressCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 3: Upcoming */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5 space-y-2 shadow-2xs hover:bg-amber-500/[0.08] hover:border-amber-500/30 transition-all">
              <div className="size-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-500/20 shadow-2xs">
                <Clock3 className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Upcoming
                </p>
                <p className="font-heading text-2xl font-black text-foreground tracking-tight">
                  {upcomingCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/80">
                  {upcomingCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 4: Cancelled / No-show */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-3.5 space-y-2 shadow-2xs hover:bg-rose-500/[0.08] hover:border-rose-500/30 transition-all">
              <div className="size-8 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center border border-rose-500/20 shadow-2xs">
                <XCircle className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Cancelled / No-show
                </p>
                <p className="font-heading text-2xl font-black text-foreground tracking-tight">
                  {cancelledNoShowCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/80">
                  {cancelledNoShowCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-2 border-t border-border/50 text-center">
            <Link
              href="/scheduler"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group transition-all"
            >
              <span>View full clinical diary</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* 4. CARD: COMPLETED TODAY */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <CheckCircle2 className="size-4" />
              </div>
              <h3 className="font-heading text-sm font-extrabold text-foreground">
                Completed today
              </h3>
              <span className="rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/60 px-2 py-0.2 text-[10px] font-black">
                {completedCount}
              </span>
            </div>

            <Link
              href="/appointments"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Completed List */}
          {completedAppointmentsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                No consultations completed yet today.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedAppointmentsList.slice(0, 5).map((appt) => {
                const patient = appt.patients;
                const patientName = patient
                  ? `${patient.first_name} ${patient.last_name}`
                  : "Patient";

                return (
                  <Link
                    key={appt.id}
                    href={`/patients/${patient?.id ?? ""}`}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border/80 transition-all shadow-2xs"
                  >
                    {/* Time */}
                    <span className="font-mono text-xs font-bold text-muted-foreground w-18 shrink-0">
                      {format(new Date(appt.starts_at), "hh:mm a")}
                    </span>

                    {/* Small Avatar */}
                    <div className="size-7 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                      {patient ? `${patient.first_name[0]}` : "P"}
                    </div>

                    {/* Name & Service */}
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                        {patientName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        {appt.services?.name ?? "Consultation"}
                      </p>
                    </div>

                    {/* Green Check Indicator */}
                    <div className="size-6 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center border border-emerald-300 dark:border-emerald-900/60 shrink-0 shadow-2xs">
                      <Check className="size-3.5 stroke-[2.5]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
