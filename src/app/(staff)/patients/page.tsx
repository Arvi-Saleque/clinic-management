import type { Metadata } from "next";
import {
  CalendarClock,
  CircleCheck,
  ContactRound,
  Users,
} from "lucide-react";

import { NewPatientDialog } from "@/components/staff/new-patient-dialog";
import { PatientTableView, type PatientRecordItem } from "@/components/staff/patient-table-view";
import { requireStaff } from "@/lib/auth/guards";
import { listPatients } from "@/lib/server/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Patients" };

export default async function StaffPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireStaff();
  const { q } = await searchParams;
  const rawPatients = await listPatients(q);
  const isReceptionist = profile.role === "receptionist";

  // Map to structured PatientRecordItem
  const patients: PatientRecordItem[] = rawPatients.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    patient_reference: p.patient_reference,
    phone: p.phone,
    dob: p.dob,
    created_at: p.created_at,
    latest_visit: p.latest_visit
      ? {
        id: p.latest_visit.id,
        starts_at: p.latest_visit.starts_at,
        status: p.latest_visit.status,
        notes: p.latest_visit.notes,
        services: p.latest_visit.services ? { name: p.latest_visit.services.name } : null,
      }
      : null,
    follow_up: p.follow_up
      ? {
        id: p.follow_up.id,
        starts_at: p.follow_up.starts_at,
        status: p.follow_up.status,
        services: p.follow_up.services ? { name: p.follow_up.services.name } : null,
      }
      : null,
  }));

  const withCompletedCare = patients.filter((patient) => patient.latest_visit?.status === "completed").length;
  const withFollowUp = patients.filter((patient) => patient.follow_up).length;
  const newThisMonth = patients.filter((patient) => {
    if (!patient.created_at) return false;
    const diff = (Date.now() - new Date(patient.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

  const stats = isReceptionist
    ? [
        { label: "Total registered", value: patients.length, icon: Users, tone: "bg-primary/10 text-primary border border-primary/20" },
        { label: "Upcoming visits", value: withFollowUp, icon: CalendarClock, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60" },
        { label: "New this month", value: newThisMonth, icon: CircleCheck, tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60" },
      ]
    : [
        { label: "Total records", value: patients.length, icon: Users, tone: "bg-primary/10 text-primary border border-primary/20" },
        { label: "Care completed", value: withCompletedCare, icon: CircleCheck, tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60" },
        { label: "Follow-up booked", value: withFollowUp, icon: CalendarClock, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60" },
      ];

  return (
    <div className="space-y-6 w-full max-w-[1600px] pb-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & ACTIONS                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border/60 pb-5">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <ContactRound className="size-3.5" />
            {isReceptionist ? "Patient Directory" : "Central Patient Records"}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isReceptionist ? "Patients" : "Patient Records"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            {isReceptionist
              ? "Search registered patients, review contact information, and open administrative profiles."
              : "One searchable history for visits, presenting symptoms, completed treatments, recall planning, prescriptions and odontograms."}
          </p>
        </div>

        {/* Top Right Action: Register New Patient */}
        <div>
          <NewPatientDialog />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATS STRIP                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card p-4.5 sm:p-5 shadow-xs">
            <span className={cn("flex size-11 items-center justify-center rounded-2xl shrink-0 shadow-2xs", item.tone)}>
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-black text-foreground">{item.value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. PATIENTS PAGINATED TABLE                                   */}
      {/* ------------------------------------------------------------- */}
      <PatientTableView patients={patients} isReceptionist={isReceptionist} />
    </div>
  );
}
