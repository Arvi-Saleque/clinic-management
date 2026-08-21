"use client";

import { useRef, useState } from "react";
import {
  ClipboardList,
  History,
  Pill,
  Smile,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OdontogramChart } from "@/components/shared/odontogram-chart";
import type { EncounterWorkspaceContext } from "@/types/clinical";
import { AppointmentContextCard } from "./appointment-context-card";
import { ClinicalDocumentationSummary } from "./clinical-documentation-summary";
import { EncounterDraftForm, type EncounterDraftFormRef } from "./encounter-draft-form";
import { EncounterHeader } from "./encounter-header";
import { EncounterPrescriptionModule } from "./encounter-prescription-module";
import { MedicalAlertsCard } from "./medical-alerts-card";
import { PatientContextCard } from "./patient-context-card";
import { PreviousEncounters } from "./previous-encounters";

interface EncounterWorkspaceProps {
  context: EncounterWorkspaceContext;
}

type WorkspaceSection =
  | "documentation"
  | "odontogram"
  | "prescriptions"
  | "patient"
  | "history";

const workspaceTabs: Array<{
  value: WorkspaceSection;
  label: string;
  badgeCount?: (ctx: EncounterWorkspaceContext) => number | null;
  icon: typeof ClipboardList;
}> = [
  {
    value: "documentation",
    label: "Clinical Notes & Treatment",
    icon: ClipboardList,
  },
  {
    value: "odontogram",
    label: "Dental Charting",
    icon: Smile,
  },
  {
    value: "prescriptions",
    label: "Prescriptions & Medications",
    badgeCount: (ctx) => (ctx.prescriptions?.length ? ctx.prescriptions.length : null),
    icon: Pill,
  },
  {
    value: "patient",
    label: "Medical History & Alerts",
    badgeCount: (ctx) => {
      const allergyCount = ctx.medical_history?.allergies?.length ?? 0;
      const condCount = ctx.medical_history?.chronic_conditions?.length ?? 0;
      const total = allergyCount + condCount;
      return total > 0 ? total : null;
    },
    icon: UserRound,
  },
  {
    value: "history",
    label: "Visit History & Encounters",
    badgeCount: (ctx) => (ctx.previous_encounters?.length ? ctx.previous_encounters.length : null),
    icon: History,
  },
];

export function EncounterWorkspace({ context }: EncounterWorkspaceProps) {
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("documentation");
  const draftFormRef = useRef<EncounterDraftFormRef>(null);

  // Universal Complete Trigger that can be called from ANY tab/page
  const handleUniversalComplete = () => {
    if (draftFormRef.current) {
      draftFormRef.current.triggerComplete();
    }
  };

  const handleValidationFail = () => {
    setActiveSection("documentation");
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Patient Header with Universal Complete Button */}
      <EncounterHeader
        context={context}
        isDirty={isDraftDirty}
        onCompleteConsultation={handleUniversalComplete}
      />

      {/* Tab Navigation Pill Bar with UK Clinical Dental Terminology */}
      <nav
        aria-label="Consultation clinical sections"
        className="overflow-x-auto rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xs p-1.5 shadow-2xs"
      >
        <div className="flex min-w-max items-center gap-1.5" role="tablist">
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.value;
            const count = tab.badgeCount ? tab.badgeCount(context) : null;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSection(tab.value)}
                className={cn(
                  "flex h-9.5 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer",
                  isActive
                    ? "bg-[#0B3B36] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
                {count !== null && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── SECTION PANELS ── */}
      {/* Panels stay mounted in DOM so draft & prescription state is never lost when switching tabs */}

      {/* 1. Clinical Notes & Treatment */}
      <section hidden={activeSection !== "documentation"} role="tabpanel">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
          {/* Left Column (8 cols): Clinical Documentation Form */}
          <div className="xl:col-span-8 min-w-0">
            {context.is_editable ? (
              <EncounterDraftForm
                ref={draftFormRef}
                encounter={context.encounter}
                privateNotes={context.private_notes}
                patient={context.patient}
                appointment={context.appointment}
                followUpScheduling={context.follow_up_scheduling}
                onDirtyChange={setIsDraftDirty}
                onValidationFail={handleValidationFail}
              />
            ) : (
              <ClinicalDocumentationSummary
                encounter={context.encounter}
                privateNotes={context.private_notes}
                patient={context.patient}
                followUpScheduling={context.follow_up_scheduling}
                followUpAppointments={context.follow_up_appointments}
                isEditable={false}
              />
            )}
          </div>

          {/* Right Column (4 cols): Consultation Snapshot */}
          <aside className="xl:col-span-4 sticky top-6">
            <AppointmentContextCard
              appointment={context.appointment}
              encounter={context.encounter}
              isDirty={isDraftDirty}
            />
          </aside>
        </div>
      </section>

      {/* 2. Dental Charting (Odontogram) */}
      <section hidden={activeSection !== "odontogram"} role="tabpanel">
        <OdontogramChart
          encounterId={context.encounter.id}
          entries={context.odontogram.current_entries}
          encounterEntries={context.odontogram.encounter_entries}
          editable={context.is_editable}
        />
      </section>

      {/* 3. Prescriptions & Medications */}
      <section hidden={activeSection !== "prescriptions"} role="tabpanel">
        <EncounterPrescriptionModule
          encounterId={context.encounter.id}
          prescriptions={context.prescriptions}
          editable={context.is_editable}
        />
      </section>

      {/* 4. Medical History & Alerts */}
      <section hidden={activeSection !== "patient"} role="tabpanel">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <MedicalAlertsCard medicalHistory={context.medical_history} />
          <PatientContextCard
            patient={context.patient}
            medicalHistory={context.medical_history}
          />
        </div>
      </section>

      {/* 5. Visit History & Encounters */}
      <section hidden={activeSection !== "history"} role="tabpanel">
        <PreviousEncounters encounters={context.previous_encounters} />
      </section>
    </div>
  );
}
