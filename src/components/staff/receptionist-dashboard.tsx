"use client";

import * as React from "react";
import Link from "next/link";
import { format, differenceInMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  CreditCard,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewAppointmentDialog } from "@/components/staff/new-appointment-dialog";
import { NewPatientDialog } from "@/components/staff/new-patient-dialog";
import { RescheduleAppointmentDialog } from "@/components/staff/reschedule-appointment-dialog";
import { updateAppointmentStatus } from "@/lib/server/appointments";
import type {
  ReceptionistDashboardAppointment,
  ReceptionistDashboardContext,
} from "@/lib/server/dashboard";

interface ReceptionistDashboardProps {
  context: ReceptionistDashboardContext;
}

export function ReceptionistDashboard({ context }: ReceptionistDashboardProps) {
  const router = useRouter();
  const {
    profile,
    todayDateFormatted,
    greeting,
    practitioners,
    services,
    activePractitionerId,
    nextAppointment,
    waitingAppointments,
    upcomingAppointments,
    completedAppointments,
    counts,
  } = context;

  // Modals state
  const [bookOpen, setBookOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    React.useState<ReceptionistDashboardAppointment | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // First name for greeting
  const firstName = profile.full_name?.split(" ")[0] || "Receptionist";

  // Practitioner filter handler
  function handlePractitionerFilter(value: string | null) {
    const pId = value && value !== "all" ? value : undefined;
    if (pId) {
      router.push(`/dashboard?practitioner=${pId}`);
    } else {
      router.push("/dashboard");
    }
  }

  // Check-in action handler
  async function handleCheckIn(appointmentId: string) {
    setProcessingId(appointmentId);
    try {
      const res = await updateAppointmentStatus(appointmentId, "checked_in");
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Patient checked in and marked waiting");
        router.refresh();
      }
    } catch {
      toast.error("Failed to check in patient");
    } finally {
      setProcessingId(null);
    }
  }

  // Cancel / DNA action handler
  async function handleStatusChange(
    appointmentId: string,
    status: "cancelled" | "no_show",
  ) {
    setProcessingId(appointmentId);
    try {
      const res = await updateAppointmentStatus(appointmentId, status);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          status === "no_show"
            ? "Marked as Did Not Attend"
            : "Appointment cancelled",
        );
        router.refresh();
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  }

  // Default practitioner and branch for booking modal
  const defaultPractitioner = practitioners[0];
  const defaultBranchId = defaultPractitioner?.branch_id || "";

  // Relative time helper for hero
  const now = new Date();
  let nextRelativeTime = "Today";
  if (nextAppointment) {
    if (nextAppointment.status === "checked_in") {
      nextRelativeTime = "Arrived / Waiting";
    } else {
      const apptDate = new Date(nextAppointment.starts_at);
      const diffMins = differenceInMinutes(apptDate, now);
      if (diffMins > 0 && diffMins <= 60) {
        nextRelativeTime = `In ${diffMins} min`;
      } else if (diffMins <= 0 && diffMins >= -30) {
        nextRelativeTime = "Due now";
      } else {
        nextRelativeTime = format(apptDate, "h:mm a");
      }
    }
  }

  const nextPatient = nextAppointment?.patients;
  const nextPatientName = nextPatient
    ? `${nextPatient.first_name} ${nextPatient.last_name}`
    : "Patient";

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ============================================================= */}
      {/* 1. HEADER & QUICK ACTIONS                                     */}
      {/* ============================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>{todayDateFormatted}</span>
            <span>&middot;</span>
            <span className="text-primary font-medium">Front desk overview</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
        </div>

        {/* Practitioner Scope Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subtle Practitioner Scope Filter */}
          {practitioners.length > 1 && (
            <div className="w-48 sm:w-52">
              <Select
                value={activePractitionerId || "all"}
                onValueChange={handlePractitionerFilter}
              >
                <SelectTrigger className="h-9.5 rounded-xl border-border/80 text-xs font-semibold bg-card">
                  <SelectValue placeholder="All Practitioners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Practitioners ({practitioners.length})
                  </SelectItem>
                  {practitioners.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id} className="text-xs">
                      {pr.title ? `${pr.title} ` : ""}
                      {pr.profiles?.full_name || "Doctor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Action 1: Book Appointment */}
          <Button
            type="button"
            onClick={() => setBookOpen(true)}
            className="h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs"
          >
            <Plus className="size-3.5" />
            Book Appointment
          </Button>

          {/* Quick Action 2: Register Patient */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setRegisterOpen(true)}
            className="h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 bg-card hover:bg-muted/40"
          >
            <UserPlus className="size-3.5 text-muted-foreground" />
            Register Patient
          </Button>

          {/* Quick Action 3: Find Patient */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/patients")}
            className="h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 bg-card hover:bg-muted/40"
          >
            <Search className="size-3.5 text-muted-foreground" />
            Find Patient
          </Button>

          {/* Quick Action 4: Take Payment */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/billing/invoices")}
            className="h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 bg-card hover:bg-muted/40"
          >
            <CreditCard className="size-3.5 text-muted-foreground" />
            Take Payment
          </Button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. MAIN ROW: HERO (2/3) + TINY OPERATIONAL STATUS (1/3)        */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Next Patient Hero (8 Cols) */}
        <div className="lg:col-span-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062420] via-[#093530] to-[#0c443d] border border-emerald-900/60 p-6 sm:p-7 text-white shadow-md h-full flex flex-col justify-between">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute -right-6 -bottom-10 size-64 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300/90 flex items-center gap-1.5">
                  <UserCheck className="size-3.5" />
                  Next Patient
                </span>
                {nextAppointment && (
                  <Badge
                    variant="outline"
                    className="border-emerald-400/30 bg-emerald-950/60 text-emerald-200 text-[11px] font-semibold px-2.5 py-0.5"
                  >
                    {nextRelativeTime}
                  </Badge>
                )}
              </div>

              {nextAppointment ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="size-14 sm:size-16 rounded-2xl border border-emerald-400/40 bg-emerald-950/80 flex items-center justify-center text-lg font-extrabold text-emerald-200 shadow-xs shrink-0">
                        {nextPatient ? `${nextPatient.first_name[0]}${nextPatient.last_name[0]}` : "PT"}
                      </div>
                      <div>
                        {nextPatient ? (
                          <Link
                            href={`/patients/${nextPatient.id}`}
                            className="font-heading text-xl sm:text-2xl font-extrabold text-white hover:text-emerald-300 transition-colors underline decoration-emerald-500/50 underline-offset-4"
                          >
                            {nextPatientName}
                          </Link>
                        ) : (
                          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
                            {nextPatientName}
                          </h2>
                        )}
                        <p className="text-xs text-emerald-200/80 mt-0.5 font-mono">
                          {nextPatient?.phone || "No phone registered"}
                        </p>
                      </div>
                    </div>

                    {/* Time & Duration */}
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">
                        {format(new Date(nextAppointment.starts_at), "h:mm a")}
                      </div>
                      <div className="text-xs text-emerald-300/80 mt-0.5">
                        {nextAppointment.services?.duration_minutes || 30} min visit
                      </div>
                    </div>
                  </div>

                  {/* Details Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-800/60 text-xs">
                    <div className="flex items-center gap-2 text-emerald-100">
                      <Stethoscope className="size-4 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        <strong className="font-semibold text-white">
                          {nextAppointment.services?.name || "Dental Treatment"}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-100">
                      <User className="size-4 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Doctor:{" "}
                        <strong className="font-semibold text-white">
                          {nextAppointment.practitioners?.profiles?.full_name || "Assigned Dentist"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-sm font-bold text-white">No more upcoming appointments today</p>
                  <p className="text-xs text-emerald-200/70 max-w-sm mx-auto">
                    All scheduled visits for today are complete or no bookings are queued.
                  </p>
                </div>
              )}
            </div>

            {/* Operational Actions Footer */}
            {nextAppointment && (
              <div className="pt-4 mt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {nextAppointment.status !== "checked_in" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={processingId === nextAppointment.id}
                      onClick={() => handleCheckIn(nextAppointment.id)}
                      className="h-8.5 rounded-xl px-4 text-xs font-bold bg-white text-[#062420] hover:bg-emerald-50 shadow-xs gap-1.5"
                    >
                      {processingId === nextAppointment.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Check In Patient
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-xs py-1 px-3">
                      Arrived &amp; Waiting
                    </Badge>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRescheduleTarget(nextAppointment)}
                    className="h-8.5 rounded-xl px-3 text-xs font-medium border-emerald-600/50 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/60 hover:text-white"
                  >
                    Reschedule
                  </Button>
                </div>

                {nextPatient && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/patients/${nextPatient.id}`)}
                    className="h-8.5 text-xs text-emerald-300 hover:text-white hover:bg-emerald-900/50 gap-1 px-2.5"
                  >
                    View Account
                    <ExternalLink className="size-3" />
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* 3 Compact Operational Status Metrics (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3.5">
          {/* 1. Waiting */}
          <article className="flex-1 rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Waiting Now
              </span>
              <p className="text-[11px] text-muted-foreground">In reception</p>
            </div>
            <p className="font-heading text-3xl font-extrabold text-foreground tabular-nums">
              {counts.waiting}
            </p>
          </article>

          {/* 2. Upcoming */}
          <article className="flex-1 rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Upcoming Today
              </span>
              <p className="text-[11px] text-muted-foreground">Scheduled visits</p>
            </div>
            <p className="font-heading text-3xl font-extrabold text-foreground tabular-nums">
              {counts.upcoming}
            </p>
          </article>

          {/* 3. Completed */}
          <article className="flex-1 rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Completed Today
              </span>
              <p className="text-[11px] text-muted-foreground">Visits finished</p>
            </div>
            <p className="font-heading text-3xl font-extrabold text-foreground tabular-nums">
              {counts.completed}
            </p>
          </article>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. WAITING NOW (HIGH PRIORITY)                                */}
      {/* ============================================================= */}
      <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/15">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Clock className="size-4" />
            </span>
            <h2 className="font-heading text-base font-bold text-foreground">
              Waiting Now
            </h2>
            <Badge
              variant="outline"
              className="border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 font-mono text-[10px]"
            >
              {waitingAppointments.length}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Arrived patients waiting for doctor
          </span>
        </div>

        {waitingAppointments.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No patients currently waiting in reception.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/60 bg-muted/25 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5">Time</th>
                  <th className="py-2.5">Patient</th>
                  <th className="py-2.5">Doctor</th>
                  <th className="py-2.5">Treatment</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {waitingAppointments.map((appt) => {
                  const pName = appt.patients
                    ? `${appt.patients.first_name} ${appt.patients.last_name}`
                    : "Patient";

                  return (
                    <tr
                      key={appt.id}
                      className="hover:bg-muted/15 transition-colors h-[62px]"
                    >
                      <td className="px-5 font-mono font-bold text-foreground">
                        {format(new Date(appt.starts_at), "h:mm a")}
                      </td>
                      <td>
                        {appt.patients ? (
                          <Link
                            href={`/patients/${appt.patients.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {pName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-foreground">{pName}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {appt.patients?.phone || "No phone"}
                        </p>
                      </td>
                      <td className="font-medium text-foreground">
                        {appt.practitioners?.profiles?.full_name || "Doctor"}
                      </td>
                      <td className="text-muted-foreground">
                        {appt.services?.name || "Treatment"}
                      </td>
                      <td className="text-center">
                        <Badge
                          variant="outline"
                          className="border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-semibold"
                        >
                          Waiting
                        </Badge>
                      </td>
                      <td className="px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {appt.patients && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/patients/${appt.patients!.id}`)}
                              className="h-7.5 rounded-lg px-2.5 text-[11px] font-medium"
                            >
                              Profile
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRescheduleTarget(appt)}
                            className="h-7.5 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            Reschedule
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============================================================= */}
      {/* 4. TODAY'S UPCOMING (CHRONOLOGICAL, EXCLUDING NEXT HERO)      */}
      {/* ============================================================= */}
      <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/15">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300">
              <CalendarDays className="size-4" />
            </span>
            <h2 className="font-heading text-base font-bold text-foreground">
              Today&apos;s Upcoming
            </h2>
            <Badge
              variant="outline"
              className="border-border bg-card text-muted-foreground font-mono text-[10px]"
            >
              {upcomingAppointments.length}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Later today in queue
          </span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No further upcoming appointments scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/60 bg-muted/25 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5">Time</th>
                  <th className="py-2.5">Patient</th>
                  <th className="py-2.5">Doctor</th>
                  <th className="py-2.5">Treatment</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {upcomingAppointments.map((appt) => {
                  const pName = appt.patients
                    ? `${appt.patients.first_name} ${appt.patients.last_name}`
                    : "Patient";

                  return (
                    <tr
                      key={appt.id}
                      className="hover:bg-muted/15 transition-colors h-[62px]"
                    >
                      <td className="px-5 font-mono font-bold text-foreground">
                        {format(new Date(appt.starts_at), "h:mm a")}
                      </td>
                      <td>
                        {appt.patients ? (
                          <Link
                            href={`/patients/${appt.patients.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {pName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-foreground">{pName}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {appt.patients?.phone || "No phone"}
                        </p>
                      </td>
                      <td className="font-medium text-foreground">
                        {appt.practitioners?.profiles?.full_name || "Doctor"}
                      </td>
                      <td className="text-muted-foreground">
                        {appt.services?.name || "Treatment"}
                      </td>
                      <td className="text-center">
                        <Badge
                          variant="outline"
                          className="border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-semibold capitalize"
                        >
                          {appt.status}
                        </Badge>
                      </td>
                      <td className="px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            disabled={processingId === appt.id}
                            onClick={() => handleCheckIn(appt.id)}
                            className="h-7.5 rounded-lg px-2.5 text-[11px] font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1 shadow-2xs"
                          >
                            {processingId === appt.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            Check In
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7.5 p-0 rounded-lg text-muted-foreground"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              {appt.patients && (
                                <DropdownMenuItem
                                  onClick={() => router.push(`/patients/${appt.patients!.id}`)}
                                >
                                  <User className="size-3.5 mr-2 text-muted-foreground" />
                                  Patient Profile
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setRescheduleTarget(appt)}
                              >
                                <RefreshCw className="size-3.5 mr-2 text-muted-foreground" />
                                Reschedule Visit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appt.id, "no_show")}
                                className="text-amber-700 dark:text-amber-400"
                              >
                                <Clock3 className="size-3.5 mr-2" />
                                Did Not Attend (DNA)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appt.id, "cancelled")}
                                className="text-destructive"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Cancel Appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============================================================= */}
      {/* 5. COMPLETED TODAY (VISUALLY SECONDARY)                       */}
      {/* ============================================================= */}
      <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden opacity-95">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 bg-muted/10">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />
            </span>
            <h2 className="font-heading text-sm font-bold text-foreground">
              Completed Today
            </h2>
            <Badge
              variant="outline"
              className="border-border bg-card text-muted-foreground font-mono text-[10px]"
            >
              {completedAppointments.length}
            </Badge>
          </div>
          <Link
            href="/appointments"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View all appointments &rarr;
          </Link>
        </div>

        {completedAppointments.length === 0 ? (
          <div className="p-5 text-center text-xs text-muted-foreground">
            No completed visits recorded yet today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/60 bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">Time</th>
                  <th className="py-2">Patient</th>
                  <th className="py-2">Doctor</th>
                  <th className="py-2">Treatment</th>
                  <th className="px-5 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {completedAppointments.slice(0, 6).map((appt) => {
                  const pName = appt.patients
                    ? `${appt.patients.first_name} ${appt.patients.last_name}`
                    : "Patient";

                  return (
                    <tr key={appt.id} className="h-[52px] text-muted-foreground">
                      <td className="px-5 font-mono text-foreground font-medium">
                        {format(new Date(appt.starts_at), "h:mm a")}
                      </td>
                      <td>
                        {appt.patients ? (
                          <Link
                            href={`/patients/${appt.patients.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {pName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-foreground">{pName}</span>
                        )}
                      </td>
                      <td>{appt.practitioners?.profiles?.full_name || "Doctor"}</td>
                      <td>{appt.services?.name || "Treatment"}</td>
                      <td className="px-5 text-right">
                        <Badge
                          variant="outline"
                          className="border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium"
                        >
                          Completed
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============================================================= */}
      {/* 6. MODALS & DIALOGS                                           */}
      {/* ============================================================= */}

      {/* Book Appointment Modal */}
      {bookOpen && defaultPractitioner && (
        <NewAppointmentDialog
          practitionerId={activePractitionerId || defaultPractitioner.id}
          branchId={defaultBranchId}
          date={format(new Date(), "yyyy-MM-dd")}
          services={services}
          defaultOpen={true}
          hideTrigger={true}
        />
      )}

      {/* Register Patient Modal */}
      <NewPatientDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleAppointmentDialog
          appointmentId={rescheduleTarget.id}
          patientName={
            rescheduleTarget.patients
              ? `${rescheduleTarget.patients.first_name} ${rescheduleTarget.patients.last_name}`
              : "Patient"
          }
          serviceName={rescheduleTarget.services?.name || "Treatment"}
          serviceId={rescheduleTarget.services?.id}
          practitionerId={rescheduleTarget.practitioners?.id || defaultPractitioner?.id || ""}
          currentStartsAt={rescheduleTarget.starts_at}
          open={!!rescheduleTarget}
          onOpenChange={(isOpen) => !isOpen && setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
