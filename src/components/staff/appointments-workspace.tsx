"use client";

import * as React from "react";
import { addDays, format, startOfDay } from "date-fns";
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
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { PractitionerAppointmentSelector } from "@/components/staff/practitioner-appointment-selector";
import { AppointmentDateSelector } from "@/components/staff/appointment-date-selector";
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
import { RescheduleAppointmentDialog } from "@/components/staff/reschedule-appointment-dialog";
import { cn, formatClinicTime } from "@/lib/utils";
import { updateAppointmentStatus, type AppointmentStatus } from "@/lib/server/appointments";

export interface WorkspaceAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  originating_encounter_id?: string | null;
  practitioner_id?: string;
  practitioners?: {
    id?: string;
    title?: string | null;
    profiles: { full_name: string } | null;
  } | null;
  patients: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  services: { id?: string; name: string; duration_minutes: number } | null;
}

interface Practitioner {
  id: string;
  title: string | null;
  branch_id?: string;
  profiles: { full_name: string } | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

function statusLabel(status: string) {
  if (status === "checked_in") return "Checked in";
  if (status === "no_show") return "No show";
  if (status === "confirmed") return "Confirmed";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
    case "checked_in":
      return "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300";
    case "completed":
      return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "cancelled":
      return "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
    case "no_show":
      return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

function patientInitials(appointment: WorkspaceAppointment) {
  if (!appointment.patients) return "PT";
  const { first_name, last_name } = appointment.patients;
  return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
}

export function AppointmentsWorkspace({
  appointments,
  practitioners,
  practitionerId,
  branchId = "",
  date,
  canSelectPractitioner,
  userRole = "owner_admin",
  services = [],
}: {
  appointments: WorkspaceAppointment[];
  practitioners: Practitioner[];
  practitionerId?: string;
  branchId?: string;
  date: string;
  canSelectPractitioner: boolean;
  userRole?: string;
  services?: Service[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Reschedule dialog state
  const [rescheduleTarget, setRescheduleTarget] = React.useState<WorkspaceAppointment | null>(null);

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
      const doctorName = appointment.practitioners?.profiles?.full_name?.toLowerCase() ?? "";
      const matchesQuery =
        !normalized ||
        patientName.includes(normalized) ||
        phone.includes(normalized) ||
        service.includes(normalized) ||
        doctorName.includes(normalized);

      if (!matchesQuery) return false;

      if (!selectedStatusFilter) return true;
      if (selectedStatusFilter === "cancelled") {
        return appointment.status === "cancelled" || appointment.status === "no_show";
      }
      return appointment.status === selectedStatusFilter;
    });

    return filtered.sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  }, [appointments, query, selectedStatusFilter]);

  // Hook up table pagination on filtered appointments
  const {
    paginatedItems: paginatedAppointments,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  } = useTablePagination(filteredAppointments, { initialPageSize: 10 });

  const setDateParam = React.useCallback(
    (newDate: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("date", newDate);
      router.push(`/appointments?${nextParams.toString()}`);
    },
    [router, searchParams],
  );

  const setPractitionerParam = React.useCallback(
    (newPractitionerId: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (!newPractitionerId || newPractitionerId === "all") {
        nextParams.delete("practitioner");
      } else {
        nextParams.set("practitioner", newPractitionerId);
      }
      router.push(`/appointments?${nextParams.toString()}`);
    },
    [router, searchParams],
  );

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    setPendingId(appointmentId);
    try {
      const res = await updateAppointmentStatus(appointmentId, status);
      if (res?.error) {
        toast.error(res.error);
      } else {
        const actionLabel =
          status === "checked_in"
            ? "Patient checked in"
            : status === "no_show"
              ? "Marked as no show"
              : status === "cancelled"
                ? "Appointment cancelled"
                : "Appointment updated";
        toast.success(actionLabel);
        router.refresh();
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setPendingId(null);
    }
  };

  const formattedDate = React.useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (y && m && d) {
      return format(new Date(y, m - 1, d), "EEEE, d MMMM yyyy");
    }
    return date;
  }, [date]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TOOLBAR: Date Navigator + Search + Practitioner Picker */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        {/* Left Side: Modern Date & Practitioner Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Modern Date Selector with Stepper & Interactive Popover */}
          <AppointmentDateSelector
            currentDate={date}
            onSelectDate={(newDate) => setDateParam(newDate)}
          />

          {/* Practitioner Selector (if permitted) */}
          {canSelectPractitioner && practitioners.length > 0 && (
            <PractitionerAppointmentSelector
              practitioners={practitioners}
              currentPractitionerId={practitionerId && practitionerId !== "" ? practitionerId : "all"}
              onSelect={(val) => setPractitionerParam(val || "all")}
            />
          )}
        </div>

        {/* Right Side: Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search appointments…"
              className="h-9.5 rounded-xl border-border/80 bg-card pl-8.5 pr-8 text-xs placeholder:text-muted-foreground/70 w-full font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
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
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border cursor-pointer",
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
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border cursor-pointer",
            selectedStatusFilter === "confirmed"
              ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <CalendarDays className="size-4" />
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
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border cursor-pointer",
            selectedStatusFilter === "checked_in"
              ? "bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <UserCheck className="size-4" />
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
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border cursor-pointer",
            selectedStatusFilter === "completed"
              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
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

        {/* Cancelled / No Show */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "cancelled" ? null : "cancelled"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border cursor-pointer col-span-2 sm:col-span-1",
            selectedStatusFilter === "cancelled"
              ? "bg-red-50/50 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
            <XCircle className="size-4" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold leading-none text-foreground">
              {counts.cancelled}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Cancelled / No show
            </p>
          </div>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. APPOINTMENTS LIST CONTAINER                                */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        {/* Table Header / Filter Active Banner */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70 bg-muted/20 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
            </span>
            {selectedStatusFilter && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg"
              >
                <span>Filter: {statusLabel(selectedStatusFilter)}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter(null)}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {query && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg"
              >
                <span>Query: &ldquo;{query}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>

          <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground mb-3">
              <CalendarDays className="size-6 text-muted-foreground/60" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              No appointments found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {query || selectedStatusFilter
                ? "No visits match your search criteria or active status filter."
                : "No appointments are scheduled for this day."}
            </p>
            {(query || selectedStatusFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setSelectedStatusFilter(null);
                }}
                className="mt-4 rounded-xl text-xs font-bold"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          /* Table View */
          <div>
            {/* Header Columns (Desktop) */}
            <div className="hidden lg:grid grid-cols-[130px_1fr_180px_200px_130px_160px] gap-4 px-6 py-3 border-b border-border/60 bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <div>Time</div>
              <div>Patient</div>
              <div>Doctor</div>
              <div>Treatment / Service</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-border/60">
              {paginatedAppointments.map((appointment) => {
                const patientName = appointment.patients
                  ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                  : "Walk-in / Unlinked";
                const doctorName =
                  appointment.practitioners?.profiles?.full_name || "Assigned Clinician";
                const isConfirmed = appointment.status === "confirmed";
                const isCheckedIn = appointment.status === "checked_in";
                const isCompleted = appointment.status === "completed";
                const isCancelled =
                  appointment.status === "cancelled" || appointment.status === "no_show";

                return (
                  <li
                    key={appointment.id}
                    className="p-4 sm:px-6 hover:bg-muted/10 transition-colors"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[130px_1fr_180px_200px_130px_160px] gap-3 lg:gap-4 items-center">
                      {/* 1. Time Column */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                          <Clock3 className="size-4" />
                        </div>
                        <div>
                          <p className="font-heading text-xs font-extrabold text-foreground">
                            {formatClinicTime(appointment.starts_at)} – {formatClinicTime(appointment.ends_at)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {appointment.services?.duration_minutes ?? 30} mins
                          </p>
                        </div>
                      </div>

                      {/* 2. Patient Column */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-[#0B3B36]/30 dark:text-[#9CB080] font-black text-xs">
                          {patientInitials(appointment)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-xs font-bold text-foreground truncate">
                            {patientName}
                          </p>
                          {appointment.patients?.phone && (
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Phone className="size-2.5 inline" />
                              <span>{appointment.patients.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 3. Doctor / Practitioner */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                          <Stethoscope className="size-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {doctorName}
                        </span>
                      </div>

                      {/* 4. Treatment / Service */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {appointment.services?.name ?? "General Dental Care"}
                        </p>
                        {appointment.notes ? (
                          <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[220px] mt-0.5">
                            &ldquo;{appointment.notes}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/70 font-medium">
                            Scheduled visit
                          </p>
                        )}
                      </div>

                      {/* 5. Status Badge */}
                      <div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border shadow-2xs",
                            statusBadgeClass(appointment.status),
                          )}
                        >
                          {statusLabel(appointment.status)}
                        </Badge>
                      </div>

                      {/* 6. Actions */}
                      <div className="flex items-center justify-start gap-2 lg:justify-end min-h-[36px]">
                        {isConfirmed && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={pendingId === appointment.id}
                            onClick={() => handleStatusChange(appointment.id, "checked_in")}
                            className="h-8.5 rounded-xl px-3 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="size-3.5" />
                            Check In
                          </Button>
                        )}

                        {isCheckedIn && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-xl">
                            <UserCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
                            Checked In
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            Completed
                          </span>
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
                                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                  aria-label={`Options for ${patientName}`}
                                />
                              }
                            >
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              {/* Option 1: Profile / History */}
                              {appointment.patients && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/patients/${appointment.patients!.id}`)
                                  }
                                  className="text-xs font-medium gap-2 cursor-pointer"
                                >
                                  <UserRound className="size-3.5 text-muted-foreground" />
                                  Patient Profile
                                </DropdownMenuItem>
                              )}

                              {/* Option 2: Reschedule */}
                              <DropdownMenuItem
                                onClick={() => setRescheduleTarget(appointment)}
                                className="text-xs font-medium gap-2 cursor-pointer"
                              >
                                <RefreshCw className="size-3.5 text-muted-foreground" />
                                Reschedule Visit
                              </DropdownMenuItem>

                              {/* Status Transitions */}
                              {isConfirmed && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(appointment.id, "no_show")}
                                    className="text-xs font-medium gap-2 text-amber-700 dark:text-amber-400 cursor-pointer"
                                  >
                                    <UserX className="size-3.5" />
                                    Mark as No Show
                                  </DropdownMenuItem>
                                </>
                              )}

                              {(isConfirmed || isCheckedIn) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                    className="text-xs font-medium gap-2 text-destructive focus:text-destructive cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination Controls */}
            {filteredAppointments.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal Dialog */}
      {rescheduleTarget && (
        <RescheduleAppointmentDialog
          open={!!rescheduleTarget}
          onOpenChange={(open) => {
            if (!open) setRescheduleTarget(null);
          }}
          appointmentId={rescheduleTarget.id}
          patientName={
            rescheduleTarget.patients
              ? `${rescheduleTarget.patients.first_name} ${rescheduleTarget.patients.last_name}`
              : "Patient"
          }
          serviceName={rescheduleTarget.services?.name || "Dental Service"}
          serviceId={rescheduleTarget.services?.id}
          practitionerId={
            rescheduleTarget.practitioner_id ||
            rescheduleTarget.practitioners?.id ||
            practitionerId ||
            ""
          }
          currentStartsAt={rescheduleTarget.starts_at}
        />
      )}
    </div>
  );
}
