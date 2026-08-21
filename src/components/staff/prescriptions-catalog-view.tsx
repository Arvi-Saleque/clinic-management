"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRight,
  Pill,
  Search,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";

export interface PrescriptionRecordItem {
  id: string;
  issued_at: string;
  status: string;
  notes: string | null;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  practitioners: {
    id?: string;
    profiles: { full_name: string } | null;
  } | null;
  prescription_items: Array<{
    id: string;
    medicine_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }>;
}

interface PrescriptionsCatalogViewProps {
  prescriptions: PrescriptionRecordItem[];
}

export function PrescriptionsCatalogView({ prescriptions }: PrescriptionsCatalogViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPrescriptions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prescriptions;

    return prescriptions.filter((p) => {
      const patientName = p.patients
        ? `${p.patients.first_name} ${p.patients.last_name}`.toLowerCase()
        : "";
      const phone = p.patients?.phone?.toLowerCase() ?? "";
      const doctorName = p.practitioners?.profiles?.full_name?.toLowerCase() ?? "";
      const meds = p.prescription_items
        .map((item) => item.medicine_name.toLowerCase())
        .join(" ");

      return (
        patientName.includes(q) ||
        phone.includes(q) ||
        doctorName.includes(q) ||
        meds.includes(q)
      );
    });
  }, [prescriptions, searchQuery]);

  const pagination = useTablePagination(filteredPrescriptions, {
    initialPageSize: 8,
    initialPage: 1,
  });

  return (
    <div className="space-y-4">
      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-4 sm:px-6 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, medicine, or doctor..."
            className="h-9.5 rounded-2xl pl-9 text-xs bg-muted/25 border-border/70 focus-visible:bg-card shadow-2xs font-medium"
          />
        </div>
        <p className="text-xs text-muted-foreground self-end sm:self-center font-semibold">
          Showing <strong className="text-foreground">{filteredPrescriptions.length}</strong> {filteredPrescriptions.length === 1 ? "prescription" : "prescriptions"}
        </p>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/95 p-8 text-center shadow-xs">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
            <Pill className="size-6" />
          </span>
          <p className="mt-4 text-sm font-extrabold text-foreground">No prescriptions match your search</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Try searching with a patient name or medicine name.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs">
          <div className="grid gap-4 p-5 sm:p-6 sm:grid-cols-2">
            {pagination.paginatedItems.map((prescription) => (
              <article
                key={prescription.id}
                className="group flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 shadow-2xs">
                        <Stethoscope className="size-5 text-emerald-800" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/patients/${prescription.patients?.id ?? ""}`}
                          className="font-heading text-sm font-extrabold text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {prescription.patients
                            ? `${prescription.patients.first_name} ${prescription.patients.last_name}`
                            : "Unknown patient"}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {prescription.patients?.phone ?? "No phone"} &middot; {format(new Date(prescription.issued_at), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 capitalize text-[10px] font-bold rounded-full px-2.5 py-0.5"
                    >
                      {prescription.status}
                    </Badge>
                  </div>

                  {/* Medicines List */}
                  <div className="mt-4 divide-y divide-border/50 rounded-2xl border border-border/70 bg-muted/20 px-3.5">
                    {prescription.prescription_items.map((item) => (
                      <div key={item.id} className="py-2.5 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground">{item.medicine_name}</p>
                          <Pill className="size-3 text-primary mt-0.5" />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") || "Dose details not recorded"}
                        </p>
                        {item.instructions && (
                          <p className="text-[11px] font-semibold text-foreground/90 italic">
                            &ldquo;{item.instructions}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <p className="text-[11px] text-muted-foreground">
                    Issued by <strong className="text-foreground">{prescription.practitioners?.profiles?.full_name ?? "Practitioner"}</strong>
                  </p>
                  <Link
                    href={`/patients/${prescription.patients?.id ?? ""}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>Patient file</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Standard Modern Pagination */}
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={[6, 8, 12, 24]}
            itemLabel="prescriptions"
          />
        </div>
      )}
    </div>
  );
}
