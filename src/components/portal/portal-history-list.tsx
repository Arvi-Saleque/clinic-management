"use client";

import * as React from "react";
import { AppointmentCard, type PrescriptionSummary } from "@/components/portal/appointment-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";

export interface PortalAppointmentHistoryItem {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  practitionerName: string;
  serviceName: string;
  price: number;
  duration?: number;
  prescription: PrescriptionSummary | null;
}

interface PortalHistoryListProps {
  history: PortalAppointmentHistoryItem[];
}

export function PortalHistoryList({ history }: PortalHistoryListProps) {
  const pagination = useTablePagination(history, {
    initialPageSize: 5,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {pagination.paginatedItems.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            id={appointment.id}
            starts_at={appointment.starts_at}
            ends_at={appointment.ends_at}
            status={appointment.status}
            notes={appointment.notes}
            practitionerName={appointment.practitionerName}
            serviceName={appointment.serviceName}
            price={appointment.price}
            duration={appointment.duration}
            prescription={appointment.prescription}
          />
        ))}
      </div>

      {history.length > 5 && (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xs shadow-xs">
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="past visits"
          />
        </div>
      )}
    </div>
  );
}
