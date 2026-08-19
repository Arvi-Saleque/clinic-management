"use client";

import { useState } from "react";
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
import { EncounterDraftForm } from "./encounter-draft-form";
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
  icon: typeof ClipboardList;
}> = [
  { value: "documentation", label: "Clinical Documentation", icon: ClipboardList },
  { value: "odontogram", label: "Dental Chart", icon: Smile },
  { value: "prescriptions", label: "Prescriptions", icon: Pill },
  { value: "patient", label: "Patient Context", icon: UserRound },
  { value: "history", label: "History", icon: History },
];

export function EncounterWorkspace({ context }: EncounterWorkspaceProps) {
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("documentation");

  return (
    <div className="w-full space-y-5 pb-12">
      {/* Top Patient Header */}
      <EncounterHeader context={context} isDirty={isDraftDirty} />

      {/* Tab Navigation Pill Bar */}
      <nav
        aria-label="Consultation sections"
        className="overflow-x-auto rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xs"
      >
        <div className="flex min-w-max items-center gap-1.5" role="tablist">
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSection(tab.value)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                  isActive
                    ? "bg-[#0B3B36] text-white shadow-xs"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panels stay mounted so draft / prescription state is never lost when switching tabs. */}
      <section hidden={activeSection !== "documentation"} role="tabpanel">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
          {/* Left Column (8 cols): Clinical Documentation Form */}
          <div className="xl:col-span-8 min-w-0">
            {context.is_editable ? (
              <EncounterDraftForm
                encounter={context.encounter}
                privateNotes={context.private_notes}
                patient={context.patient}
                appointment={context.appointment}
                followUpScheduling={context.follow_up_scheduling}
                onDirtyChange={setIsDraftDirty}
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

      <section hidden={activeSection !== "odontogram"} role="tabpanel">
        <OdontogramChart
          encounterId={context.encounter.id}
          entries={context.odontogram.current_entries}
          encounterEntries={context.odontogram.encounter_entries}
          editable={context.is_editable}
        />
      </section>

      <section hidden={activeSection !== "prescriptions"} role="tabpanel">
        <EncounterPrescriptionModule
          encounterId={context.encounter.id}
          prescriptions={context.prescriptions}
          editable={context.is_editable}
        />
      </section>

      <section hidden={activeSection !== "patient"} role="tabpanel">
        <div className="grid gap-5 lg:grid-cols-2 items-start">
          <MedicalAlertsCard medicalHistory={context.medical_history} />
          <PatientContextCard
            patient={context.patient}
            medicalHistory={context.medical_history}
          />
        </div>
      </section>

      <section hidden={activeSection !== "history"} role="tabpanel">
        <PreviousEncounters encounters={context.previous_encounters} />
      </section>
    </div>
  );
}
