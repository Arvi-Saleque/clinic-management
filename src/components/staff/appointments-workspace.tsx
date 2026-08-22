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
import { NewAppointmentDialog } from "@/components/staff/new-appointment-dialog";
import { RescheduleAppointmentDialog } from "@/components/staff/reschedule-appointment-dialog";
import { cn } from "@/lib/utils";
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
      return "border-border bg-muted/50 text-muted-foreground";
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
  userRole = "dentist",
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
  const isReceptionist = userRole === "receptionist";

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

  const currentDateObj = React.useMemo(() => {
    try {
      return new Date(`${date}T00:00:00`);
    } catch {
      return new Date();
    }
  }, [date]);

  const formattedDate = React.useMemo(() => {
    return format(currentDateObj, "EEEE, d MMMM yyyy");
  }, [currentDateObj]);

  const handlePrevDay = () => {
    const prev = format(addDays(currentDateObj, -1), "yyyy-MM-dd");
    setDateParam(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(currentDateObj, 1), "yyyy-MM-dd");
    setDateParam(next);
  };

  const handleToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setDateParam(today);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TOOLBAR: Date Navigator + Search + Practitioner Picker */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        {/* Left Side: Date Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Today Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-9 rounded-xl px-3 text-xs font-semibold border-border/80 hover:bg-muted/50"
          >
            Today
          </Button>

          {/* Prev/Next Buttons */}
          <div className="flex items-center rounded-xl border border-border/80 bg-muted/20 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Date Picker Input */}
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) setDateParam(e.target.value);
            }}
            className="h-9 w-auto rounded-xl border-border/80 bg-card text-xs font-medium"
          />

          {/* Practitioner Selector (if permitted) */}
          {canSelectPractitioner && practitioners.length > 0 && (
            <div className="w-52">
              <Select
                value={practitionerId && practitionerId !== "" ? practitionerId : "all"}
                onValueChange={(val) => setPractitionerParam(val || "all")}
              >
                <SelectTrigger className="h-9 rounded-xl border-border/80 bg-card text-xs font-medium">
                  <SelectValue placeholder="All Doctors">
                    {(val: string) => {
                      if (val === "all" || !val) {
                        return `All Doctors (${practitioners.length})`;
                      }
                      const p = practitioners.find((doc) => doc.id === val);
                      return p
                        ? `${p.title ? `${p.title} ` : ""}${p.profiles?.full_name ?? "Doctor"}`
                        : "All Doctors";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Doctors ({practitioners.length})
                  </SelectItem>
                  {practitioners.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.title ? `${p.title} ` : ""}
                      {p.profiles?.full_name ?? "Doctor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Formatted Date Title */}
          <span className="font-heading font-bold text-sm sm:text-base text-foreground pl-1">
            {formattedDate}
          </span>
        </div>

        {/* Right Side: Search + Optional Book Appointment Action */}
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

          {services.length > 0 && (
            <NewAppointmentDialog
              practitionerId={
                practitionerId === "all" || !practitionerId
                  ? practitioners[0]?.id || ""
                  : practitionerId
              }
              branchId={branchId}
              date={date}
              services={services}
              practitioners={practitioners}
              triggerVariant="default"
              triggerClassName="h-9.5 gap-1.5 rounded-xl px-3 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs shrink-0 cursor-pointer"
            />
          )}
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

        {/* Cancelled / No show */}
        <button
          type="button"
          onClick={() =>
            setSelectedStatusFilter((prev) => (prev === "cancelled" ? null : "cancelled"))
          }
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-2xs hover:border-border col-span-2 sm:col-span-1 cursor-pointer",
            selectedStatusFilter === "cancelled"
              ? "bg-red-50/50 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/20"
              : "bg-muted/15 border-border/70 hover:bg-muted/30",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
            <UserX className="size-4" />
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
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        {filteredAppointments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
              <CalendarDays className="size-6" />
            </div>
            <h3 className="mt-3 font-heading text-base font-bold text-foreground">
              No appointments found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {query || selectedStatusFilter
                ? "Try adjusting your search or status filters."
                : `There are no scheduled visits for ${formattedDate}.`}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header for Desktop */}
            <div className="hidden lg:grid lg:grid-cols-[145px_1fr_160px_200px_130px_170px] gap-4 px-5 py-3 border-b border-border/70 bg-muted/25 text-[10px] font-black uppercase tracking-wider text-muted-foreground items-center">
              <div>TIME</div>
              <div>PATIENT</div>
              <div>DOCTOR</div>
              <div>TREATMENT / SERVICE</div>
              <div>STATUS</div>
              <div className="text-right pr-2">ACTIONS</div>
            </div>

            <ul className="divide-y divide-border/60">
              {filteredAppointments.map((appointment) => {
                const startFormatted = format(new Date(appointment.starts_at), "h:mm a");
                const endFormatted = format(new Date(appointment.ends_at), "h:mm a");
                const patientName = appointment.patients
                  ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                  : "Walk-in / Unassigned Patient";
                const initials = patientInitials(appointment);

                const isConfirmed = appointment.status === "confirmed";
                const isCheckedIn = appointment.status === "checked_in";
                const isCompleted = appointment.status === "completed";
                const isCancelled =
                  appointment.status === "cancelled" || appointment.status === "no_show";

                const doctorDisplayName = appointment.practitioners?.profiles?.full_name
                  ? `${appointment.practitioners.title ? `${appointment.practitioners.title} ` : ""}${appointment.practitioners.profiles.full_name}`
                  : "Assigned Doctor";

                return (
                  <li
                    key={appointment.id}
                    className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-muted/15 lg:grid-cols-[145px_1fr_160px_200px_130px_170px] lg:gap-4 lg:items-center lg:px-6 lg:py-4"
                  >
                    {/* 1. Time Block */}
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 border border-emerald-500/20 shadow-2xs">
                        <Clock3 className="size-4.5" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-extrabold tracking-tight text-foreground">
                          {startFormatted} – {endFormatted}
                        </p>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {appointment.services?.duration_minutes ?? 30} mins
                        </p>
                      </div>
                    </div>

                    {/* 2. Patient Profile Block */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-xs font-black text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 border border-emerald-500/20 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-sm font-extrabold text-foreground truncate">
                          {patientName}
                        </p>
                        {appointment.patients?.phone && (
                          <p className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-muted-foreground mt-0.5">
                            <Phone className="size-3 shrink-0" />
                            <span>{appointment.patients.phone}</span>
                          </p>
                        )}
                        {/* Mobile Doctor badge */}
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary lg:hidden mt-1">
                          <Stethoscope className="size-3 shrink-0" />
                          <span className="truncate">{doctorDisplayName}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Doctor Column (Desktop) */}
                    <div className="hidden lg:flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                        <Stethoscope className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading text-xs font-bold text-foreground truncate">
                          {doctorDisplayName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Treating Doctor
                        </p>
                      </div>
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
                    {/* Receptionist View: Front-Desk Operational Actions */}
                    {isReceptionist ? (
                      <>
                        {isConfirmed && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={pendingId === appointment.id}
                            onClick={() => handleStatusChange(appointment.id, "checked_in")}
                            className="h-8.5 rounded-xl px-3 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs gap-1.5"
                          >
                            <UserCheck className="size-3.5" />
                            Check in
                          </Button>
                        )}

                        {isCheckedIn && (
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            Waiting for Doctor
                          </span>
                        )}

                        {/* More Menu Dropdown for Receptionist */}
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
                              {/* Reschedule */}
                              <DropdownMenuItem
                                onClick={() => setRescheduleTarget(appointment)}
                                className="text-xs font-medium gap-2"
                              >
                                <RefreshCw className="size-3.5 text-primary" />
                                Reschedule visit
                              </DropdownMenuItem>

                              {/* No show */}
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appointment.id, "no_show")}
                                className="text-xs font-medium gap-2"
                              >
                                <UserX className="size-3.5 text-amber-600" />
                                No show
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Cancel */}
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                className="text-xs font-medium gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                                Cancel appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </>
                    ) : (
                      /* Clinician / Dentist View: Full Clinical Consultation CTAs */
                      <>
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

                        {/* More Menu Dropdown for Clinician */}
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
                              <DropdownMenuItem
                                onClick={() => setRescheduleTarget(appointment)}
                                className="text-xs font-medium gap-2"
                              >
                                <RefreshCw className="size-3.5 text-primary" />
                                Reschedule visit
                              </DropdownMenuItem>
                              {(isConfirmed || isCheckedIn) && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, "no_show")}
                                  className="text-xs font-medium gap-2"
                                >
                                  <UserX className="size-3.5 text-amber-600" />
                                  No show
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
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            </ul>
          </>
        )}

        {/* Table Footer */}
        <div className="border-t border-border/60 bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
          <p>
            Showing <span className="font-bold text-foreground">{filteredAppointments.length}</span>{" "}
            of {appointments.length} appointments
          </p>
        </div>
      </div>

      {/* Reschedule Modal Dialog */}
      {rescheduleTarget && (
        <RescheduleAppointmentDialog
          open={!!rescheduleTarget}
          onOpenChange={(isOpen) => !isOpen && setRescheduleTarget(null)}
          appointmentId={rescheduleTarget.id}
          patientName={
            rescheduleTarget.patients
              ? `${rescheduleTarget.patients.first_name} ${rescheduleTarget.patients.last_name}`
              : "Patient"
          }
          serviceName={rescheduleTarget.services?.name ?? "Dental Procedure"}
          serviceId={rescheduleTarget.services?.id}
          practitionerId={
            rescheduleTarget.practitioner_id ||
            (practitionerId !== "all" ? (practitionerId || "") : "") ||
            (practitioners[0]?.id ?? "")
          }
          currentStartsAt={rescheduleTarget.starts_at}
          onSuccess={() => {
            setRescheduleTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
