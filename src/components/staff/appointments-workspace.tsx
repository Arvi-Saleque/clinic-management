"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hash,
  MoreVertical,
  Phone,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConsultationActionButton } from "@/components/clinical/consultation-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateAppointmentStatus, type AppointmentStatus } from "@/lib/server/appointments";

export interface WorkspaceAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  originating_encounter_id?: string | null;
  patients: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
}

interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

function statusLabel(status: string) {
  if (status === "checked_in") return "Checked in";
  if (status === "no_show") return "Did not attend";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-blue-200/80 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
    case "checked_in":
      return "border-purple-200/80 bg-purple-50/80 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300";
    case "completed":
      return "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "cancelled":
    case "no_show":
      return "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function patientInitials(appointment: WorkspaceAppointment) {
  if (!appointment.patients) return "PT";
  const f = appointment.patients.first_name?.[0] ?? "";
  const l = appointment.patients.last_name?.[0] ?? "";
  return `${f}${l}`.toUpperCase() || "PT";
}

export function AppointmentsWorkspace({
  appointments,
  practitioners,
  practitionerId,
  date,
  canSelectPractitioner,
}: {
  appointments: WorkspaceAppointment[];
  practitioners: Practitioner[];
  practitionerId: string;
  date: string;
  canSelectPractitioner: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Status counts for KPI cards
  const counts = React.useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      checked_in: appointments.filter((a) => a.status === "checked_in").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled" || a.status === "no_show").length,
    };
  }, [appointments]);

  const filteredAppointments = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = appointments.filter((appointment) => {
      const patientName = appointment.patients
        ? `${appointment.patients.first_name} ${appointment.patients.last_name}`.toLowerCase()
        : "";
      const phone = appointment.patients?.phone?.toLowerCase() ?? "";
      const service = appointment.services?.name?.toLowerCase() ?? "";
      const matchesQuery =
        !normalized ||
        patientName.includes(normalized) ||
        phone.includes(normalized) ||
        service.includes(normalized);

      // KPI quick filter
      let matchesStatus = true;
      if (selectedStatusFilter) {
        if (selectedStatusFilter === "cancelled") {
          matchesStatus = appointment.status === "cancelled" || appointment.status === "no_show";
        } else {
          matchesStatus = appointment.status === selectedStatusFilter;
        }
      }

      return matchesQuery && matchesStatus;
    });

    // Natural chronological order by start time
    return filtered.sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  }, [appointments, query, selectedStatusFilter]);

  function navigate(next: { practitioner?: string; date?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.practitioner) params.set("practitioner", next.practitioner);
    if (next.date) params.set("date", next.date);
    router.push(`/appointments?${params.toString()}`);
  }

  function shiftDay(delta: number) {
    const next = addDays(new Date(`${date}T00:00:00`), delta);
    navigate({ date: format(next, "yyyy-MM-dd") });
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setPendingId(id);
    const reason = status === "cancelled" ? "Cancelled by staff" : undefined;
    const { error } = await updateAppointmentStatus(id, status, reason);
    setPendingId(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Appointment updated");
    router.refresh();
  }

  const activePractitioner = practitioners.find((item) => item.id === practitionerId);
  const formattedDate = format(new Date(`${date}T00:00:00`), "EEEE, d MMMM yyyy");

  return (
    <div className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden space-y-5 p-5 sm:p-6 w-full">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP CONTROL BAR                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Doctor Selector + Date Picker Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor Selector */}
          {canSelectPractitioner && practitioners.length > 1 ? (
            <Select
              value={practitionerId}
              onValueChange={(value) => value && navigate({ practitioner: value })}
            >
              <SelectTrigger className="h-9.5 min-w-[200px] rounded-xl border-border/80 bg-card px-3 text-xs font-semibold">
                <UserRound className="size-3.5 text-muted-foreground mr-1.5" />
                <SelectValue>
                  {(id: string) =>
                    practitioners.find((item) => item.id === id)?.profiles?.full_name ??
                    "Practitioner"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.profiles?.full_name ?? "Practitioner"} {p.title ? `(${p.title})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-9.5 items-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-3 text-xs font-semibold text-foreground">
              <UserRound className="size-3.5 text-muted-foreground" />
              <span>{activePractitioner?.profiles?.full_name ?? "My appointments"}</span>
            </div>
          )}

          {/* Date Controls */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => shiftDay(-1)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
              onClick={() => navigate({ date: format(new Date(), "yyyy-MM-dd") })}
            >
              <CalendarDays className="size-3.5 text-primary" />
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => shiftDay(1)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Formatted Date Title */}
          <span className="font-heading font-bold text-sm sm:text-base text-foreground pl-1">
            {formattedDate}
          </span>
        </div>

        {/* Right Side: Search Only */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search appointments…"
            className="h-9.5 rounded-xl border-border/80 bg-card pl-8.5 pr-3 text-xs placeholder:text-muted-foreground/70 w-full"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. KPI / STATUS SUMMARY STRIP (Interactive Quick Filters)     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <button
          type="button"
          onClick={() => setSelectedStatusFilter(null)}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border",
            selectedStatusFilter === null
              ? "bg-card border-[#0B3B36]/50 ring-2 ring-[#0B3B36]/15"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
            <Hash className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.total}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Total
            </p>
          </div>
        </button>

        {/* Confirmed */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "confirmed" ? null : "confirmed"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border",
            selectedStatusFilter === "confirmed"
              ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <UserCheck className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.confirmed}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Confirmed
            </p>
          </div>
        </button>

        {/* Checked in */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "checked_in" ? null : "checked_in"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border",
            selectedStatusFilter === "checked_in"
              ? "bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
            <Clock3 className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.checked_in}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Checked in
            </p>
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "completed" ? null : "completed"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border",
            selectedStatusFilter === "completed"
              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.completed}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Completed
            </p>
          </div>
        </button>

        {/* Cancelled */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "cancelled" ? null : "cancelled"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border col-span-2 sm:col-span-1",
            selectedStatusFilter === "cancelled"
              ? "bg-red-50/50 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <XCircle className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.cancelled}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Cancelled
            </p>
          </div>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. APPOINTMENTS TABLE LIST                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        {/* Table Header Row */}
        <div className="hidden grid-cols-[100px_minmax(180px,1.4fr)_minmax(180px,1.5fr)_110px_130px_minmax(190px,auto)] gap-4 border-b border-border/60 bg-muted/20 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Time</span>
          <span>Patient</span>
          <span>Treatment</span>
          <span>Duration</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Table Body / Empty State */}
        {filteredAppointments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
              <CalendarDays className="size-5.5" />
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-foreground">
              No appointments found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {appointments.length === 0
                ? "There are no appointments scheduled for this practitioner on this date."
                : "Try changing your search query or status filters."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredAppointments.map((appointment) => {
              const patientName = appointment.patients
                ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                : "Unknown patient";

              const calculatedDuration = Math.max(
                0,
                Math.round(
                  (new Date(appointment.ends_at).getTime() -
                    new Date(appointment.starts_at).getTime()) /
                    60000,
                ),
              );
              const duration = appointment.services?.duration_minutes ?? calculatedDuration;

              const isConfirmed = appointment.status === "confirmed";
              const isCheckedIn = appointment.status === "checked_in";
              const isCompleted = appointment.status === "completed";
              const isCancelled =
                appointment.status === "cancelled" || appointment.status === "no_show";

              return (
                <li
                  key={appointment.id}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/20 lg:grid-cols-[100px_minmax(180px,1.4fr)_minmax(180px,1.5fr)_110px_130px_minmax(190px,auto)] lg:items-center lg:gap-4"
                >
                  {/* 1. Time */}
                  <div className="flex items-baseline gap-2 lg:block">
                    <p className="font-heading text-sm font-extrabold text-foreground tabular-nums">
                      {format(new Date(appointment.starts_at), "HH:mm")}
                    </p>
                    <p className="text-[11px] text-muted-foreground lg:mt-0.5">
                      {duration} min
                    </p>
                  </div>

                  {/* 2. Patient */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold text-xs border border-emerald-200/50 dark:border-emerald-800/40">
                      {patientInitials(appointment)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {patientName}
                      </p>
                      {appointment.patients?.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="size-3 text-muted-foreground/70" />
                          <span className="truncate">{appointment.patients.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Treatment */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {appointment.services?.name ?? "General Dental Visit"}
                    </p>
                    {appointment.originating_encounter_id && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Follow-up visit
                      </p>
                    )}
                  </div>

                  {/* 4. Duration */}
                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
                    <Clock3 className="size-3.5 text-muted-foreground/70" />
                    <span>{duration} min</span>
                  </div>

                  {/* 5. Status Pill */}
                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        statusBadgeClass(appointment.status),
                      )}
                    >
                      {statusLabel(appointment.status)}
                    </Badge>
                  </div>

                  {/* 6. Actions */}
                  <div className="flex items-center justify-between gap-2 lg:justify-end">
                    {/* Primary Button */}
                    {isConfirmed && (
                      <ConsultationActionButton
                        appointmentId={appointment.id}
                        status={appointment.status}
                        size="xs"
                        className="h-8.5 rounded-xl px-3.5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs"
                      />
                    )}

                    {isCheckedIn && (
                      <ConsultationActionButton
                        appointmentId={appointment.id}
                        status={appointment.status}
                        size="xs"
                        className="h-8.5 rounded-xl px-3.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 shadow-2xs"
                      />
                    )}

                    {isCompleted && (
                      <ConsultationActionButton
                        appointmentId={appointment.id}
                        status={appointment.status}
                        size="xs"
                        variant="outline"
                        className="h-8.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 text-foreground hover:bg-muted/50 shadow-2xs"
                      />
                    )}

                    {/* More Menu Dropdown */}
                    {!isCancelled && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={pendingId === appointment.id}
                              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                              aria-label={`Options for ${patientName}`}
                            />
                          }
                        >
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5">
                          {isConfirmed && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(appointment.id, "checked_in")}
                              className="text-xs font-medium gap-2"
                            >
                              <UserCheck className="size-3.5 text-purple-600" />
                              Check in
                            </DropdownMenuItem>
                          )}
                          {(isConfirmed || isCheckedIn) && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(appointment.id, "no_show")}
                              className="text-xs font-medium gap-2"
                            >
                              <UserX className="size-3.5 text-amber-600" />
                              Did not attend
                            </DropdownMenuItem>
                          )}
                          {(isConfirmed || isCheckedIn) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                className="text-xs font-medium gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                                Cancel appointment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Table Footer */}
        <div className="border-t border-border/60 bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
          <p>
            Showing <span className="font-bold text-foreground">{filteredAppointments.length}</span>{" "}
            of {appointments.length} appointments
          </p>
        </div>
      </div>
    </div>
  );
}
