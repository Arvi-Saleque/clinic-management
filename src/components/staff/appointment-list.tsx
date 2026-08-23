"use client";

import * as React from "react";
import { Clock, MoreVertical, Phone } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConsultationActionButton } from "@/components/clinical/consultation-action-button";
import { updateAppointmentStatus, type AppointmentStatus } from "@/lib/server/appointments";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { cn, formatClinicTime } from "@/lib/utils";

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  originating_encounter_id?: string | null;
  patients: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
}

const STATUS_STYLE: Record<string, string> = {
  completed:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  confirmed:
    "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  pending:
    "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  checked_in:
    "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
  cancelled:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  no_show:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
};

// Canonical lifecycle: checked_in appointments must only be completed via the clinical consultation workflow
const NEXT_ACTIONS: Record<string, { label: string; status: AppointmentStatus }[]> = {
  confirmed: [
    { label: "Check in", status: "checked_in" },
    { label: "No show", status: "no_show" },
  ],
  checked_in: [],
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const pagination = useTablePagination(appointments, {
    initialPageSize: 10,
  });

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setPendingId(id);
    const reason = status === "cancelled" ? "Cancelled by staff" : undefined;
    const { error } = await updateAppointmentStatus(id, status, reason);
    setPendingId(null);
    if (error) toast.error(error);
    else toast.success("Appointment updated");
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No appointments for this practitioner on this day.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <ul className="divide-y divide-border">
        {pagination.paginatedItems.map((appt) => {
        const actions = NEXT_ACTIONS[appt.status] ?? [];
        return (
          <li key={appt.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="flex w-20 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums">
                <Clock className="size-3.5 text-muted-foreground" />
                {formatClinicTime(appt.starts_at)}
              </div>
              <div>
                <p className="font-medium">
                  {appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown patient"}
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {appt.services?.name}
                  {appt.patients?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {appt.patients.phone}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border shadow-2xs",
                  STATUS_STYLE[appt.status] ?? "border-border bg-muted/40 text-foreground",
                )}
              >
                {appt.status === "no_show"
                  ? "No show"
                  : appt.status === "checked_in"
                    ? "Checked in"
                    : appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replaceAll("_", " ")}
              </Badge>

              {appt.originating_encounter_id && (
                <Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary font-medium text-[11px]">
                  Follow-up
                </Badge>
              )}

              <ConsultationActionButton
                appointmentId={appt.id}
                status={appt.status}
                size="xs"
              />

              {(actions.length > 0 || appt.status === "pending" || appt.status === "confirmed") && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" disabled={pendingId === appt.id} />}
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.status}
                        onClick={() => handleStatusChange(appt.id, action.status)}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                    {(appt.status === "pending" || appt.status === "confirmed") && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleStatusChange(appt.id, "cancelled")}
                      >
                        Cancel
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

    {appointments.length > 10 && (
      <TablePagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.onPageChange}
        onPageSizeChange={pagination.onPageSizeChange}
        itemLabel="appointments"
      />
    )}
  </div>
  );
}
