"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";

interface ClinicianUpcomingAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  services: {
    name: string;
    duration_minutes: number;
  } | null;
}

interface ClinicianUpcomingAppointmentsListProps {
  appointments: ClinicianUpcomingAppointment[];
}

export function ClinicianUpcomingAppointmentsList({
  appointments,
}: ClinicianUpcomingAppointmentsListProps) {
  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    onPageChange,
    onPageSizeChange,
  } = useTablePagination(appointments, {
    initialPageSize: 5,
  });

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
        <p className="text-xs font-bold text-muted-foreground">
          No upcoming appointments remaining today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginatedItems.map((appt) => {
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
                  {format(new Date(appt.starts_at), "h:mm a")}
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

      {appointments.length > 5 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20]}
          itemLabel="upcoming appointments"
          compact
        />
      )}
    </div>
  );
}
