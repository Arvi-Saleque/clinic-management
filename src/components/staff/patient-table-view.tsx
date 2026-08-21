"use client";

import * as React from "react";
import Link from "next/link";
import { differenceInYears, format } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Phone,
  Search,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { cn } from "@/lib/utils";

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

function formatAppointmentStatusLabel(status: string) {
  if (status === "no_show") return "No show";
  if (status === "checked_in") return "Checked in";
  if (status === "confirmed" || status === "pending") return "Confirmed";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

export interface PatientRecordItem {
  id: string;
  first_name: string;
  last_name: string;
  patient_reference: string;
  phone: string | null;
  email?: string | null;
  dob: string | null;
  gender?: string | null;
  address?: string | null;
  created_at: string;
  latest_visit?: {
    id: string;
    starts_at: string;
    status: string;
    notes: string | null;
    services?: { name: string } | null;
  } | null;
  follow_up?: {
    id: string;
    starts_at: string;
    status: string;
    services?: { name: string } | null;
  } | null;
}

interface PatientTableViewProps {
  patients: PatientRecordItem[];
  isReceptionist: boolean;
}

export function PatientTableView({ patients, isReceptionist }: PatientTableViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPatients = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const phone = p.phone?.toLowerCase() ?? "";
      const ref = p.patient_reference.toLowerCase();
      const email = p.email?.toLowerCase() ?? "";
      return fullName.includes(q) || phone.includes(q) || ref.includes(q) || email.includes(q);
    });
  }, [patients, searchQuery]);

  const pagination = useTablePagination(filteredPatients, {
    initialPageSize: 10,
  });

  return (
    <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
      {/* ── 1. Top Search & Summary Bar ── */}
      <div className="flex flex-col gap-3.5 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-muted/10">
        <div className="relative w-full sm:w-88">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name, phone, or PT ID..."
            className="h-10 rounded-2xl pl-10 pr-9 text-xs bg-card border-border/80 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-2xs">
            <Users className="size-3 text-primary" />
            <span>
              Showing <strong className="text-foreground">{filteredPatients.length}</strong> of{" "}
              <strong className="text-foreground">{patients.length}</strong> patients
            </span>
          </span>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground border border-border/60">
            <UserRoundSearch className="size-7" />
          </span>
          <p className="mt-4 text-base font-extrabold text-foreground font-heading">
            No matching patient record
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Try searching by full or partial name, phone number, or the PT-prefixed patient ID.
          </p>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4 h-8.5 rounded-xl px-4 text-xs font-semibold"
            >
              Clear search filter
            </Button>
          )}
        </div>
      ) : isReceptionist ? (
        /* ── RECEPTIONIST TABLE: Front-Desk Focused ── */
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/25 border-b border-border/70">
                <TableRow className="hover:bg-muted/25 border-border/60">
                  <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    PATIENT
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    PATIENT REF
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    CONTACT NUMBER
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    DOB / AGE
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    NEXT APPOINTMENT
                  </TableHead>
                  <TableHead className="h-12 w-16 text-right pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {pagination.paginatedItems.map((patient) => {
                  const followUp = patient.follow_up;
                  const age = patient.dob
                    ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
                    : null;

                  return (
                    <TableRow
                      key={patient.id}
                      className="group h-[72px] hover:bg-muted/15 transition-colors"
                    >
                      {/* Patient Name + Initials */}
                      <TableCell className="px-6">
                        <Link href={`/patients/${patient.id}`} className="flex items-center gap-3.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/20 shadow-2xs">
                            {patient.first_name[0]}
                            {patient.last_name[0]}
                          </span>
                          <div>
                            <span className="block font-heading text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                              {patient.first_name} {patient.last_name}
                            </span>
                            {patient.email && (
                              <span className="block text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">
                                {patient.email}
                              </span>
                            )}
                          </div>
                        </Link>
                      </TableCell>

                      {/* Reference ID */}
                      <TableCell>
                        <span className="inline-flex items-center rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-bold text-foreground tracking-tight shadow-2xs">
                          {patient.patient_reference}
                        </span>
                      </TableCell>

                      {/* Contact (Phone) */}
                      <TableCell>
                        <p className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground">
                          <Phone className="size-3 text-muted-foreground" />
                          <span>{patient.phone || "No phone"}</span>
                        </p>
                      </TableCell>

                      {/* DOB / Age */}
                      <TableCell>
                        <p className="text-xs text-foreground font-semibold">
                          {patient.dob
                            ? format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")
                            : "—"}
                          {age !== null && (
                            <span className="text-muted-foreground font-medium ml-1.5 text-[11px]">
                              ({age} yrs)
                            </span>
                          )}
                        </p>
                      </TableCell>

                      {/* Next Appointment */}
                      <TableCell>
                        {followUp ? (
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 shrink-0">
                              <CalendarDays className="size-4" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                {followUp.services?.name ?? "Booked Visit"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic font-medium">
                            No upcoming visit
                          </span>
                        )}
                      </TableCell>

                      {/* Action Arrow */}
                      <TableCell className="pr-6 text-right">
                        <Link
                          href={`/patients/${patient.id}`}
                          aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-[#0B3B36] hover:text-white hover:border-[#0B3B36] transition-all shadow-2xs"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Bar */}
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            itemLabel="patients"
          />
        </>
      ) : (
        /* ── CLINICIAN / DENTIST TABLE: Medical Records Focused ── */
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/25 border-b border-border/70">
                <TableRow className="hover:bg-muted/25 border-border/60">
                  <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    PATIENT
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    PATIENT ID
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    LAST VISIT &amp; PROCEDURE
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    CARE STATUS
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    NEXT RECALL / FOLLOW-UP
                  </TableHead>
                  <TableHead className="h-12 w-16 pr-6 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {pagination.paginatedItems.map((patient) => {
                  const latest = patient.latest_visit;
                  const followUp = patient.follow_up;
                  return (
                    <TableRow
                      key={patient.id}
                      className="group h-[76px] hover:bg-muted/15 transition-colors"
                    >
                      {/* Patient Name + Avatar */}
                      <TableCell className="px-6">
                        <Link href={`/patients/${patient.id}`} className="flex items-center gap-3.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/20 shadow-2xs">
                            {patient.first_name[0]}
                            {patient.last_name[0]}
                          </span>
                          <div>
                            <span className="block font-heading text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                              {patient.first_name} {patient.last_name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground font-medium">
                              {patient.phone ?? "No phone"}
                              {patient.dob
                                ? ` · DOB ${format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")}`
                                : ""}
                            </span>
                          </div>
                        </Link>
                      </TableCell>

                      {/* Reference ID */}
                      <TableCell>
                        <span className="inline-flex items-center rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-bold text-foreground tracking-tight shadow-2xs">
                          {patient.patient_reference}
                        </span>
                      </TableCell>

                      {/* Last Visit & Procedure */}
                      <TableCell className="max-w-[280px]">
                        {latest ? (
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {format(new Date(latest.starts_at), "dd MMM yyyy")} ·{" "}
                              <span className="text-primary font-extrabold">
                                {latest.services?.name ?? "Visit"}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground font-medium">
                              {latest.notes ? `“${latest.notes}”` : "Routine consultation completed"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic font-medium">
                            No visit recorded
                          </span>
                        )}
                      </TableCell>

                      {/* Care Status */}
                      <TableCell>
                        {latest ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border shadow-2xs",
                              STATUS_STYLE[latest.status] ??
                                "border-border bg-muted/40 text-foreground",
                            )}
                          >
                            {formatAppointmentStatusLabel(latest.status)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground border-border/70"
                          >
                            No Appointment
                          </Badge>
                        )}
                      </TableCell>

                      {/* Next Recall / Follow-up */}
                      <TableCell>
                        {followUp ? (
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 shrink-0">
                              <Clock3 className="size-4" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                {followUp.services?.name ?? "Follow-up visit"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic font-medium">
                            Not booked
                          </span>
                        )}
                      </TableCell>

                      {/* Action Arrow */}
                      <TableCell className="pr-6 text-right">
                        <Link
                          href={`/patients/${patient.id}`}
                          aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-[#0B3B36] hover:text-white hover:border-[#0B3B36] transition-all shadow-2xs"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Bar */}
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            itemLabel="patient records"
          />
        </>
      )}
    </section>
  );
}
