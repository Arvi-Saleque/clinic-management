"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MoreVertical,
  Phone,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ConsultationActionButton } from "@/components/clinical/consultation-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "Did not attend" },
] as const;

const NEXT_ACTIONS: Record<string, { label: string; status: AppointmentStatus }[]> = {
  pending: [{ label: "Confirm", status: "confirmed" }],
  confirmed: [
    { label: "Check in", status: "checked_in" },
    { label: "Did not attend", status: "no_show" },
  ],
  checked_in: [],
};

function statusLabel(status: string) {
  if (status === "checked_in") return "Checked in";
  if (status === "no_show") return "Did not attend";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function statusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
    case "checked_in":
      return "border-violet-200/70 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300";
    case "completed":
      return "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300";
    case "cancelled":
    case "no_show":
      return "border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300";
    case "pending":
      return "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function patientInitials(appointment: WorkspaceAppointment) {
  if (!appointment.patients) return "—";
  return `${appointment.patients.first_name[0] ?? ""}${appointment.patients.last_name[0] ?? ""}`.toUpperCase();
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
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [services, setServices] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState("time-asc");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const serviceOptions = React.useMemo(
    () => Array.from(new Set(appointments.map((item) => item.services?.name).filter((value): value is string => Boolean(value)))).sort(),
    [appointments],
  );

  const filteredAppointments = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = appointments.filter((appointment) => {
      const patientName = appointment.patients
        ? `${appointment.patients.first_name} ${appointment.patients.last_name}`.toLowerCase()
        : "";
      const phone = appointment.patients?.phone?.toLowerCase() ?? "";
      const service = appointment.services?.name?.toLowerCase() ?? "";
      const matchesQuery = !normalized || patientName.includes(normalized) || phone.includes(normalized) || service.includes(normalized);
      const matchesStatus = statuses.length === 0 || statuses.includes(appointment.status);
      const matchesService = services.length === 0 || (appointment.services?.name ? services.includes(appointment.services.name) : false);
      return matchesQuery && matchesStatus && matchesService;
    });

    return filtered.sort((a, b) => {
      if (sort === "time-desc") return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
      if (sort === "patient") {
        const aName = a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "";
        const bName = b.patients ? `${b.patients.first_name} ${b.patients.last_name}` : "";
        return aName.localeCompare(bName);
      }
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  }, [appointments, query, services, sort, statuses]);

  const activeFilterCount = statuses.length + services.length;

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

  function toggleFilter(value: string, checked: boolean, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((current) => checked ? [...current, value] : current.filter((item) => item !== value));
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

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_18px_55px_-42px_rgba(4,34,31,0.38)]">
      <div className="border-b border-border/80 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {canSelectPractitioner && practitioners.length > 1 ? (
              <Select value={practitionerId} onValueChange={(value) => value && navigate({ practitioner: value })}>
                <SelectTrigger className="h-10 min-w-52 rounded-xl border-border bg-background px-3">
                  <UserRound className="size-4 text-muted-foreground" />
                  <SelectValue>
                    {(id: string) => practitioners.find((item) => item.id === id)?.profiles?.full_name ?? "Practitioner"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {practitioners.map((practitioner) => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      {practitioner.profiles?.full_name ?? "Practitioner"}{practitioner.title ? ` — ${practitioner.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold">
                <UserRound className="size-4 text-muted-foreground" />
                <span>{activePractitioner?.profiles?.full_name ?? "My appointments"}</span>
              </div>
            )}

            <div className="flex h-10 items-center rounded-xl border border-border bg-background p-1">
              <Button variant="ghost" size="icon-sm" onClick={() => shiftDay(-1)} aria-label="Previous day">
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-3"
                onClick={() => navigate({ date: format(new Date(), "yyyy-MM-dd") })}
              >
                <CalendarDays className="size-4 text-primary" />
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => shiftDay(1)} aria-label="Next day">
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <span className="px-1 text-sm font-semibold text-foreground">
              {format(new Date(`${date}T00:00:00`), "EEEE, d MMMM yyyy")}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:max-w-[610px] xl:justify-end">
            <div className="relative min-w-[210px] flex-1 xl:max-w-[290px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search appointments…"
                className="h-10 rounded-xl border-border bg-background pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="h-10 gap-2 rounded-xl bg-background" />}>
                <Filter className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1.5">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statuses.includes(option.value)}
                    onCheckedChange={(checked) => toggleFilter(option.value, Boolean(checked), setStatuses)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Treatment</DropdownMenuLabel>
                <div className="max-h-52 overflow-y-auto">
                  {serviceOptions.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">No treatments on this date</div>
                  ) : serviceOptions.map((service) => (
                    <DropdownMenuCheckboxItem
                      key={service}
                      checked={services.includes(service)}
                      onCheckedChange={(checked) => toggleFilter(service, Boolean(checked), setServices)}
                    >
                      {service}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setStatuses([]); setServices([]); }}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={sort} onValueChange={(value) => value && setSort(value)}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-background px-3">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                <SelectValue>
                  {(value: string) => value === "time-desc" ? "Latest first" : value === "patient" ? "Patient name" : "Earliest first"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="time-asc">Earliest first</SelectItem>
                <SelectItem value="time-desc">Latest first</SelectItem>
                <SelectItem value="patient">Patient name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-[90px_minmax(190px,1.25fr)_minmax(190px,1.3fr)_90px_120px_minmax(165px,auto)] gap-4 border-b border-border/70 bg-muted/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
        <span>Time</span>
        <span>Patient</span>
        <span>Treatment</span>
        <span>Duration</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <CalendarDays className="size-5" />
          </div>
          <h3 className="mt-4 font-heading text-base font-extrabold">No appointments found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {appointments.length === 0 ? "There are no appointments for this practitioner on the selected date." : "Try changing your search or filters."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/75">
          {filteredAppointments.map((appointment) => {
            const actions = NEXT_ACTIONS[appointment.status] ?? [];
            const patientName = appointment.patients
              ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
              : "Unknown patient";
            const calculatedDuration = Math.max(
              0,
              Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000),
            );
            const duration = appointment.services?.duration_minutes ?? calculatedDuration;

            return (
              <li
                key={appointment.id}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5 lg:grid-cols-[90px_minmax(190px,1.25fr)_minmax(190px,1.3fr)_90px_120px_minmax(165px,auto)] lg:items-center lg:gap-4"
              >
                <div className="flex items-center gap-2 lg:block">
                  <p className="text-sm font-extrabold tracking-tight">{format(new Date(appointment.starts_at), "HH:mm")}</p>
                  <p className="text-[11px] text-muted-foreground lg:mt-1">{duration} min</p>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-extrabold text-primary">
                    {patientInitials(appointment)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{patientName}</p>
                    {appointment.patients?.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="size-3" />
                        <span className="truncate">{appointment.patients.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{appointment.services?.name ?? "—"}</p>
                  {appointment.originating_encounter_id && (
                    <p className="mt-0.5 text-[11px] font-medium text-primary">Follow-up appointment</p>
                  )}
                </div>

                <div className="hidden items-center gap-1.5 text-sm text-muted-foreground lg:flex">
                  <Clock3 className="size-3.5" />
                  <span>{duration} min</span>
                </div>

                <div>
                  <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", statusClass(appointment.status))}>
                    {statusLabel(appointment.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <ConsultationActionButton appointmentId={appointment.id} status={appointment.status} size="xs" />

                  {(actions.length > 0 || appointment.status === "pending" || appointment.status === "confirmed") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" disabled={pendingId === appointment.id} aria-label={`More actions for ${patientName}`} />}
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem key={action.status} onClick={() => handleStatusChange(appointment.id, action.status)}>
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                        {(appointment.status === "pending" || appointment.status === "confirmed") && (
                          <DropdownMenuItem variant="destructive" onClick={() => handleStatusChange(appointment.id, "cancelled")}>
                            Cancel appointment
                          </DropdownMenuItem>
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

      <div className="flex flex-col gap-1 border-t border-border/70 bg-muted/15 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredAppointments.length}</span> of {appointments.length} appointments
        </p>
        <p className="text-xs text-muted-foreground">
          {appointments.filter((item) => item.status === "confirmed").length} confirmed · {appointments.filter((item) => item.status === "checked_in").length} checked in · {appointments.filter((item) => item.status === "completed").length} completed
        </p>
      </div>
    </section>
  );
}
