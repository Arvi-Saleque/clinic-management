"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Mail,
  Phone,
  Search,
  User,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { cn, formatClinicDate, formatClinicTime } from "@/lib/utils";

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
  doctor?: {
    id: string;
    full_name: string;
    title?: string | null;
  } | null;
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

type PatientFilterTab = "all" | "with_upcoming" | "no_upcoming";

export function PatientTableView({ patients, isReceptionist }: PatientTableViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<PatientFilterTab>("all");

  // Tab counts
  const countWithUpcoming = React.useMemo(
    () => patients.filter((p) => !!p.follow_up).length,
    [patients]
  );
  const countNoUpcoming = patients.length - countWithUpcoming;

  // Filtered patients based on search and active tab
  const filteredPatients = React.useMemo(() => {
    let result = patients;

    // Filter by tab
    if (activeTab === "with_upcoming") {
      result = result.filter((p) => !!p.follow_up);
    } else if (activeTab === "no_upcoming") {
      result = result.filter((p) => !p.follow_up);
    }

    // Filter by query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = p.phone?.toLowerCase() ?? "";
        const ref = p.patient_reference.toLowerCase();
        const email = p.email?.toLowerCase() ?? "";
        return fullName.includes(q) || phone.includes(q) || ref.includes(q) || email.includes(q);
      });
    }

    return result;
  }, [patients, searchQuery, activeTab]);

  const pagination = useTablePagination(filteredPatients, {
    initialPageSize: 10,
  });

  // Reset pagination on search or tab switch
  React.useEffect(() => {
    pagination.resetPage();
  }, [searchQuery, activeTab]);

  return (
    <div className="space-y-4">
      {/* ── 1. Top Control Strip: Search & Filter Tabs ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 rounded-3xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs">
        {/* Left: Search Box */}
        <div className="relative w-full lg:w-96">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name, phone, or PT ID..."
            className="h-10 rounded-2xl pl-10 pr-9 text-xs bg-muted/20 border-border/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs font-medium placeholder:text-muted-foreground/70"
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

        {/* Center/Right: Filter Tabs + Counter Badge */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 rounded-2xl border border-border/80 bg-muted/25 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                activeTab === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <span>All Patients</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {patients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("with_upcoming")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                activeTab === "with_upcoming"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <span>Upcoming Visit</span>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary font-black">
                {countWithUpcoming}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("no_upcoming")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                activeTab === "no_upcoming"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <span>No Visit Queued</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {countNoUpcoming}
              </span>
            </button>
          </div>

          {/* Showing Counter Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-2xs">
            <Users className="size-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{filteredPatients.length}</strong> patient{filteredPatients.length === 1 ? "" : "s"}
            </span>
          </span>
        </div>
      </div>

      {/* ── 2. Main Patient Records Display ── */}
      <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
        {filteredPatients.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-muted/40 text-muted-foreground border border-border/70 shadow-2xs">
              <UserRoundSearch className="size-8 text-primary" />
            </span>
            <p className="mt-4 text-base font-extrabold text-foreground font-heading">
              No matching patient found
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Try searching by name, phone number, or patient reference ID.
            </p>
            {(searchQuery || activeTab !== "all") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="mt-4 h-9 rounded-xl px-4 text-xs font-bold"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : isReceptionist ? (
          /* ══════════════════════════════════════════════════════════════════════════ */
          /* ── RECEPTIONIST DIRECTORY VIEW: Modern, Aesthetic & Lucrative Layout ── */
          /* ══════════════════════════════════════════════════════════════════════════ */
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-3.5 pl-6 pr-4">PATIENT</th>
                    <th className="py-3.5 px-4">PATIENT ID</th>
                    <th className="py-3.5 px-4">LAST APPOINTMENT</th>
                    <th className="py-3.5 px-4">DOCTOR</th>
                    <th className="py-3.5 px-4">NEXT APPOINTMENT</th>
                    <th className="py-3.5 pr-6 pl-4 text-right">ACTION</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border/40">
                  {pagination.paginatedItems.map((patient) => {
                    const latest = patient.latest_visit;
                    const followUp = patient.follow_up;
                    const doctorName = patient.doctor?.full_name || "Unassigned";

                    return (
                      <tr
                        key={patient.id}
                        className="group hover:bg-muted/25 transition-all duration-150 h-[72px]"
                      >
                        {/* Patient Name & Avatar */}
                        <td className="py-3 pl-6 pr-4">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="flex items-center gap-3.5 group/link"
                          >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B3B36]/15 via-[#0B3B36]/10 to-[#0B3B36]/5 text-[#0B3B36] dark:from-emerald-500/25 dark:to-emerald-500/10 dark:text-emerald-300 font-black text-xs border border-emerald-500/25 shadow-2xs group-hover/link:scale-105 transition-transform">
                              {patient.first_name[0]}
                              {patient.last_name[0]}
                            </span>
                            <div className="min-w-0">
                              <span className="block font-heading text-sm font-extrabold text-foreground group-hover/link:text-primary transition-colors truncate">
                                {patient.first_name} {patient.last_name}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium mt-0.5">
                                {patient.phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="size-2.5 text-muted-foreground/70" />
                                    <span>{patient.phone}</span>
                                  </span>
                                )}
                                {patient.phone && patient.email && <span>&middot;</span>}
                                {patient.email && (
                                  <span className="truncate max-w-[160px]">{patient.email}</span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* Reference ID Capsule */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-xl border border-border/80 bg-muted/30 px-2.5 py-1 font-mono text-[11px] font-bold text-foreground tracking-tight shadow-2xs">
                            {patient.patient_reference}
                          </span>
                        </td>

                        {/* Last Appointment */}
                        <td className="py-3 px-4 max-w-[240px]">
                          {latest ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">
                                  {formatClinicDate(latest.starts_at)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-md px-1.5 py-0 text-[10px] font-bold uppercase",
                                    STATUS_STYLE[latest.status] ??
                                      "border-border bg-muted/40 text-foreground"
                                  )}
                                >
                                  {formatAppointmentStatusLabel(latest.status)}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate font-medium">
                                {latest.services?.name ?? "Dental Procedure"}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic font-medium">
                              <Clock3 className="size-3" />
                              No previous visit
                            </span>
                          )}
                        </td>

                        {/* Attending Doctor */}
                        <td className="py-3 px-4">
                          {patient.doctor ? (
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-7.5 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                                <User className="size-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {patient.doctor.full_name}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">
                                  {patient.doctor.title || "Attending Dentist"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Next Scheduled Visit */}
                        <td className="py-3 px-4">
                          {followUp ? (
                            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/30 p-2 pr-3">
                              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500 text-white dark:bg-blue-600 shrink-0 shadow-2xs">
                                <CalendarDays className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-blue-950 dark:text-blue-200 truncate">
                                  {formatClinicDate(followUp.starts_at, { weekday: "short", day: "numeric", month: "short" })} · {formatClinicTime(followUp.starts_at)}
                                </p>
                                <p className="text-[10px] text-blue-800/80 dark:text-blue-300/80 font-semibold truncate">
                                  {followUp.services?.name ?? "Scheduled Visit"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-muted/20 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                              <Clock3 className="size-3 text-muted-foreground/70" />
                              No upcoming visit
                            </span>
                          )}
                        </td>

                        {/* Fast Actions */}
                        <td className="py-3 pr-6 pl-4 text-right">
                          <Link
                            href={`/patients/${patient.id}`}
                            aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-[#0B3B36] hover:text-white hover:border-[#0B3B36] text-xs font-bold text-foreground transition-all shadow-2xs group/btn"
                          >
                            <span>Profile</span>
                            <ArrowUpRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card Layout */}
            <div className="lg:hidden divide-y divide-border/50">
              {pagination.paginatedItems.map((patient) => {
                const latest = patient.latest_visit;
                const followUp = patient.follow_up;

                return (
                  <div key={patient.id} className="p-4 space-y-3.5">
                    {/* Top Row: Avatar, Name & Profile Button */}
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-xs border border-emerald-500/20 shadow-2xs">
                          {patient.first_name[0]}
                          {patient.last_name[0]}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-heading text-sm font-extrabold text-foreground hover:text-primary transition-colors truncate">
                            {patient.first_name} {patient.last_name}
                          </span>
                          <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground mt-0.5">
                            {patient.patient_reference}
                          </span>
                        </div>
                      </Link>

                      <Link
                        href={`/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-border/80 bg-card hover:bg-[#0B3B36] hover:text-white text-xs font-bold transition-colors shrink-0"
                      >
                        <span>Profile</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-border/70 bg-muted/15 p-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Doctor
                        </span>
                        <p className="font-bold text-foreground truncate mt-0.5">
                          {patient.doctor?.full_name || "Unassigned"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-muted/15 p-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Last Visit
                        </span>
                        <p className="font-semibold text-foreground truncate mt-0.5">
                          {latest ? (
                            <span>{formatClinicDate(latest.starts_at)}</span>
                          ) : (
                            <span className="text-muted-foreground">No visit</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Next Appointment Badge */}
                    {followUp ? (
                      <div className="flex items-center gap-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 p-2.5">
                        <CalendarDays className="size-4 text-blue-700 dark:text-blue-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-blue-950 dark:text-blue-200 truncate">
                            {formatClinicDate(followUp.starts_at, { weekday: "short", day: "numeric", month: "short" })} · {formatClinicTime(followUp.starts_at)}
                          </p>
                          <p className="text-[10px] text-blue-800/80 dark:text-blue-300 font-semibold truncate">
                            {followUp.services?.name ?? "Visit"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium px-1">
                        <Clock3 className="size-3" />
                        <span>No upcoming visit booked</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="patients"
            />
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════════ */
          /* ── CLINICIAN / DENTIST TABLE: Medical Records Focused Layout ──           */
          /* ══════════════════════════════════════════════════════════════════════════ */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-3.5 pl-6 pr-4">PATIENT</th>
                    <th className="py-3.5 px-4">PATIENT ID</th>
                    <th className="py-3.5 px-4">LAST VISIT &amp; PROCEDURE</th>
                    <th className="py-3.5 px-4">CARE STATUS</th>
                    <th className="py-3.5 px-4">NEXT RECALL / FOLLOW-UP</th>
                    <th className="py-3.5 pr-6 pl-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pagination.paginatedItems.map((patient) => {
                    const latest = patient.latest_visit;
                    const followUp = patient.follow_up;
                    return (
                      <tr
                        key={patient.id}
                        className="group hover:bg-muted/25 transition-all duration-150 h-[76px]"
                      >
                        {/* Patient Name + Avatar */}
                        <td className="py-3 pl-6 pr-4">
                          <Link href={`/patients/${patient.id}`} className="flex items-center gap-3.5">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B3B36]/15 via-[#0B3B36]/10 to-[#0B3B36]/5 text-[#0B3B36] dark:from-emerald-500/25 dark:to-emerald-500/10 dark:text-emerald-300 font-black text-xs border border-emerald-500/25 shadow-2xs">
                              {patient.first_name[0]}
                              {patient.last_name[0]}
                            </span>
                            <div className="min-w-0">
                              <span className="block font-heading text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                                {patient.first_name} {patient.last_name}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-muted-foreground font-medium truncate">
                                {patient.phone ?? "No phone"}
                                {patient.dob
                                  ? ` · DOB ${format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")}`
                                  : ""}
                              </span>
                            </div>
                          </Link>
                        </td>

                        {/* Reference ID */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-xl border border-border/80 bg-muted/30 px-2.5 py-1 font-mono text-[11px] font-bold text-foreground tracking-tight shadow-2xs">
                            {patient.patient_reference}
                          </span>
                        </td>

                        {/* Last Visit & Procedure */}
                        <td className="py-3 px-4 max-w-[280px]">
                          {latest ? (
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {formatClinicDate(latest.starts_at)} ·{" "}
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
                        </td>

                        {/* Care Status */}
                        <td className="py-3 px-4">
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
                        </td>

                        {/* Next Recall / Follow-up */}
                        <td className="py-3 px-4">
                          {followUp ? (
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 shrink-0">
                                <Clock3 className="size-4" />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  {formatClinicDate(followUp.starts_at, { day: "2-digit", month: "short" })}, {formatClinicTime(followUp.starts_at)}
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
                        </td>

                        {/* Action Arrow */}
                        <td className="py-3 pr-6 pl-4 text-right">
                          <Link
                            href={`/patients/${patient.id}`}
                            aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-[#0B3B36] hover:text-white hover:border-[#0B3B36] text-xs font-bold text-foreground transition-all shadow-2xs group/btn"
                          >
                            <span>Profile</span>
                            <ArrowUpRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="patient records"
            />
          </>
        )}
      </section>
    </div>
  );
}
