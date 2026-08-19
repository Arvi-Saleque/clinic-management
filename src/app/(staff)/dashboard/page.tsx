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

  // Dentists & Owner Admins preserve their existing clinician dashboard
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

  // Next appointment time relative string (e.g. "In 18 min", "Now", "10:00 AM")
  let nextRelativeTime = "Today";
  if (nextAppointment) {
    const apptDate = new Date(nextAppointment.starts_at);
    const diffMins = differenceInMinutes(apptDate, now);
    if (diffMins > 0 && diffMins <= 60) {
      nextRelativeTime = `In ${diffMins} min`;
    } else if (diffMins <= 0 && diffMins >= -30) {
      nextRelativeTime = "In progress";
    } else {
      nextRelativeTime = format(apptDate, "h:mm a");
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
      {/* ============================================================= */}
      {/* LEFT COLUMN (8 cols): Hero Banner + Upcoming Appointments     */}
      {/* ============================================================= */}
      <div className="xl:col-span-8 space-y-6 min-w-0">
        {/* 1. HERO BANNER: NEXT APPOINTMENT */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062420] via-[#093530] to-[#0c443d] border border-emerald-900/60 p-6 sm:p-7 text-white shadow-lg">
          {/* Subtle dental watermark / glow */}
          <div className="pointer-events-none absolute -right-6 -bottom-10 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.07] hidden sm:block">
            <svg viewBox="0 0 200 200" className="size-64 fill-white">
              <path d="M100 20C70 20 50 40 50 70C50 100 65 140 80 180C85 195 95 195 100 175C105 195 115 195 120 180C135 140 150 100 150 70C150 40 130 20 100 20Z" />
            </svg>
          </div>

          <div className="relative space-y-5">
            {/* Top Label */}
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300/80">
              Next Appointment
            </p>

            {nextAppointment ? (
              <div className="space-y-5">
                {/* Patient Header Block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Patient Avatar */}
                    <div className="size-16 sm:size-18 rounded-full border-2 border-emerald-400/50 bg-emerald-950/80 flex items-center justify-center text-lg sm:text-xl font-extrabold text-emerald-200 shadow-md shrink-0">
                      {nextPatient ? `${nextPatient.first_name[0]}${nextPatient.last_name[0]}` : "PT"}
                    </div>

                    {/* Name + Badge */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          {nextPatientName}
                        </h2>
                        <span className="rounded-full bg-emerald-900/70 text-emerald-200 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs">
                          {isNewPatient ? "New patient" : "Returning patient"}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/70 mt-0.5">
                        {nextPatient?.phone ?? "Patient on schedule"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4-Metric Data Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-800/50">
                  {/* Metric 1: Time */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/70">
                      <Clock className="size-3 text-emerald-300" />
                      <span>Time</span>
                    </div>
                    <p className="font-heading text-base font-extrabold text-white">
                      {format(new Date(nextAppointment.starts_at), "hh:mm a")}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-300/90">
                      {nextRelativeTime}
                    </p>
                  </div>

                  {/* Metric 2: Service */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/70">
                      <Stethoscope className="size-3 text-emerald-300" />
                      <span>Service</span>
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate">
                      {nextAppointment.services?.name ?? "Dental Consultation"}
                    </p>
                    <p className="text-[11px] text-emerald-200/60 truncate">
                      {nextAppointment.notes || "Standard care"}
                    </p>
                  </div>

                  {/* Metric 3: Duration */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/70">
                      <Clock3 className="size-3 text-emerald-300" />
                      <span>Duration</span>
                    </div>
                    <p className="font-heading text-base font-extrabold text-white">
                      {nextAppointment.services?.duration_minutes ?? 30} min
                    </p>
                  </div>

                  {/* Metric 4: Location */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/70">
                      <Building2 className="size-3 text-emerald-300" />
                      <span>Location</span>
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate">
                      {nextAppointment.branches?.name || "Operatory 2"}
                    </p>
                  </div>
                </div>

                {/* Bottom Action CTAs */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <ButtonLink
                    href="/appointments"
                    variant="ghost"
                    className="h-9 px-4 rounded-xl border border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/15 backdrop-blur-xs gap-1.5"
                  >
                    <span>View appointment</span>
                    <ExternalLink className="size-3.5" />
                  </ButtonLink>

                  <ConsultationActionButton
                    appointmentId={nextAppointment.id}
                    status={nextAppointment.status}
                    size="sm"
                    className="h-9 px-5 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-[#062420] font-bold text-xs shadow-md"
                  />
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="font-bold text-sm text-white">
                  No more appointments scheduled for today.
                </p>
                <p className="text-xs text-emerald-200/70">
                  You are all caught up. Check your weekly schedule or add new appointments.
                </p>
                <div className="pt-2">
                  <ButtonLink
                    href="/scheduler"
                    variant="ghost"
                    className="h-8.5 px-4 rounded-xl border border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Open Scheduler
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. CARD: TODAY'S UPCOMING APPOINTMENTS */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <Calendar className="size-4" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Today&apos;s upcoming appointments
              </h3>
            </div>

            <Link
              href="/appointments"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View full schedule</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* List of Upcoming Items */}
          {upcomingAppointmentsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                No upcoming appointments remaining today.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {upcomingAppointmentsList.map((appt) => {
                const patient = appt.patients;
                const patientName = patient
                  ? `${patient.first_name} ${patient.last_name}`
                  : "Patient";

                return (
                  <Link
                    key={appt.id}
                    href={`/patients/${patient?.id ?? ""}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1 hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-all"
                  >
                    {/* Time & Timeline Circle */}
                    <div className="flex items-center gap-3 w-28 shrink-0">
                      <span className="font-heading text-xs font-bold text-foreground">
                        {format(new Date(appt.starts_at), "hh:mm a")}
                      </span>
                      <span className="size-2 rounded-full border-2 border-muted-foreground/40 bg-card group-hover:border-primary shrink-0" />
                    </div>

                    {/* Patient Name */}
                    <div className="min-w-0 w-44 shrink-0">
                      <span className="font-bold text-xs text-foreground group-hover:text-primary truncate block">
                        {patientName}
                      </span>
                    </div>

                    {/* Service & Tooth/Notes */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {appt.services?.name ?? "Dental Check-up"}
                      </p>
                      {appt.notes && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {appt.notes}
                        </p>
                      )}
                    </div>

                    {/* Duration & Action Chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground font-medium">
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
          <div className="pt-2 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{upcomingAppointmentsList.length} appointments remaining</span>
          </div>
        </section>
      </div>

      {/* ============================================================= */}
      {/* RIGHT COLUMN (4 cols): Progress + Completed                   */}
      {/* ============================================================= */}
      <aside className="xl:col-span-4 space-y-6">
        {/* 3. CARD: TODAY'S PROGRESS */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Today&apos;s progress
            </h3>
          </div>

          {/* 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: Completed */}
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2 shadow-2xs">
              <div className="size-7 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60">
                <Check className="size-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Completed
                </p>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {completedCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {completedCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 2: In Progress */}
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2 shadow-2xs">
              <div className="size-7 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center border border-blue-200/60">
                <Loader2 className="size-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  In progress
                </p>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {inProgressCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {inProgressCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 3: Upcoming */}
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2 shadow-2xs">
              <div className="size-7 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center border border-amber-200/60">
                <Clock3 className="size-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Upcoming
                </p>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {upcomingCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {upcomingCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>

            {/* Tile 4: Cancelled / No-show */}
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2 shadow-2xs">
              <div className="size-7 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-center border border-rose-200/60">
                <XCircle className="size-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Cancelled / No-show
                </p>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {cancelledNoShowCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {cancelledNoShowCount === 1 ? "appointment" : "appointments"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-2 border-t border-border/50 text-center">
            <Link
              href="/scheduler"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View full clinical diary</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* 4. CARD: COMPLETED TODAY */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground">
                Completed today
              </h3>
              <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2 py-0.2 text-[10px] font-semibold">
                {completedCount}
              </span>
            </div>

            <Link
              href="/appointments"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          {/* Completed List */}
          {completedAppointmentsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center">
              <p className="text-xs text-muted-foreground">
                No consultations completed yet today.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {completedAppointmentsList.slice(0, 5).map((appt) => {
                const patient = appt.patients;
                const patientName = patient
                  ? `${patient.first_name} ${patient.last_name}`
                  : "Patient";

                return (
                  <Link
                    key={appt.id}
                    href={`/patients/${patient?.id ?? ""}`}
                    className="group flex items-center justify-between gap-2.5 py-2.5 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-all"
                  >
                    {/* Time */}
                    <span className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0">
                      {format(new Date(appt.starts_at), "hh:mm a")}
                    </span>

                    {/* Small Avatar */}
                    <div className="size-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {patient ? `${patient.first_name[0]}` : "P"}
                    </div>

                    {/* Name & Service */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary">
                        {patientName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {appt.services?.name ?? "Consultation"}
                      </p>
                    </div>

                    {/* Green Check Indicator */}
                    <div className="size-5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 shrink-0">
                      <Check className="size-3" />
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
