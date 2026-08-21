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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  checked_in: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  no_show: "border-destructive/20 bg-destructive/10 text-destructive",
};

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
    <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs">
      {/* Search Bar & Count */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, or PT ID..."
            className="h-9.5 rounded-2xl pl-9 text-xs bg-muted/25 border-border/70 focus-visible:bg-card shadow-2xs font-medium"
          />
        </div>
        <p className="text-xs text-muted-foreground self-end sm:self-center font-medium">
          Showing <strong className="text-foreground">{filteredPatients.length}</strong> {filteredPatients.length === 1 ? "patient record" : "patient records"}
        </p>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
            <UserRoundSearch className="size-6" />
          </span>
          <p className="mt-4 text-sm font-extrabold text-foreground">No matching patient record</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Try searching by full or partial name, phone number, or the PT-prefixed patient ID.
          </p>
        </div>
      ) : isReceptionist ? (
        /* RECEPTIONIST TABLE: Front-Desk Focused */
        <>
          <Table>
            <TableHeader className="bg-muted/25">
              <TableRow className="hover:bg-muted/25 border-border/60">
                <TableHead className="h-11 px-5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  PATIENT
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  PATIENT ID
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  CONTACT
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  DOB / AGE
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  NEXT APPOINTMENT
                </TableHead>
                <TableHead className="h-11 w-12 text-right pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/40">
              {pagination.paginatedItems.map((patient) => {
                const followUp = patient.follow_up;
                const age = patient.dob
                  ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
                  : null;

                return (
                  <TableRow key={patient.id} className="group h-[68px] hover:bg-muted/20 transition-colors">
                    {/* Patient Name + Initials */}
                    <TableCell className="px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200/50">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                        <div>
                          <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {patient.first_name} {patient.last_name}
                          </span>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Reference ID */}
                    <TableCell>
                      <span className="rounded-lg border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[10px] font-bold text-muted-foreground">
                        {patient.patient_reference}
                      </span>
                    </TableCell>

                    {/* Contact (Phone) */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-xs font-mono font-medium text-foreground">
                          <Phone className="size-3 text-muted-foreground/70" />
                          {patient.phone || "No phone"}
                        </p>
                      </div>
                    </TableCell>

                    {/* DOB / Age */}
                    <TableCell>
                      <p className="text-xs text-foreground font-medium">
                        {patient.dob ? format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy") : "—"}
                        {age !== null && <span className="text-muted-foreground font-normal ml-1">({age}y)</span>}
                      </p>
                    </TableCell>

                    {/* Next Appointment */}
                    <TableCell>
                      {followUp ? (
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <CalendarDays className="size-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {followUp.services?.name ?? "Booked Visit"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No upcoming visit</span>
                      )}
                    </TableCell>

                    {/* Action Arrow */}
                    <TableCell className="pr-5 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                        className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-[#0B3B36] group-hover:text-white"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
        /* CLINICIAN / DENTIST TABLE */
        <>
          <Table>
            <TableHeader className="bg-muted/25">
              <TableRow className="hover:bg-muted/25 border-border/60">
                <TableHead className="h-11 px-5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  PATIENT
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  PATIENT ID
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  LAST VISIT &amp; PROCEDURE
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  CARE STATUS
                </TableHead>
                <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  RECALL / FOLLOW-UP
                </TableHead>
                <TableHead className="h-11 w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/40">
              {pagination.paginatedItems.map((patient) => {
                const latest = patient.latest_visit;
                const followUp = patient.follow_up;
                return (
                  <TableRow key={patient.id} className="group h-[72px] hover:bg-muted/20 transition-colors">
                    <TableCell className="px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/50">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {patient.first_name} {patient.last_name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground font-medium">
                            {patient.phone ?? "No phone"}{patient.dob ? ` · DOB ${format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")}` : ""}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-lg border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] font-bold tracking-wide">
                        {patient.patient_reference}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {latest ? (
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {format(new Date(latest.starts_at), "dd MMM yyyy")} · {latest.services?.name ?? "Visit"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {latest.notes || "No presenting notes recorded"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No visit recorded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {latest ? (
                        <Badge variant="outline" className={cn("capitalize font-bold text-[11px] rounded-lg", STATUS_STYLE[latest.status])}>
                          {latest.status === "completed" ? "Work completed" : latest.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] rounded-lg">Not started</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {followUp ? (
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
                            <Clock3 className="size-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {followUp.services?.name ?? "Follow-up visit"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not booked</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                        className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-[#0B3B36] group-hover:text-white"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
