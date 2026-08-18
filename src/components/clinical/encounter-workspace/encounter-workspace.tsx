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
    <div className="mx-auto w-full max-w-[1480px] space-y-5">
      <EncounterHeader context={context} isDirty={isDraftDirty} />

      <nav
        aria-label="Consultation sections"
        className="overflow-x-auto rounded-2xl border border-border/70 bg-surface/90 p-1.5 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)]"
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
                  "relative flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-14px_rgba(0,103,89,0.85)]"
                    : "text-muted-foreground hover:bg-primary-soft/55 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panels stay mounted so draft / prescription state is never lost when switching tabs. */}
      <section hidden={activeSection !== "documentation"} role="tabpanel">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {context.is_editable ? (
              <EncounterDraftForm
                encounter={context.encounter}
                privateNotes={context.private_notes}
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

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <AppointmentContextCard appointment={context.appointment} />
          </aside>
        </div>
      </section>

      <section hidden={activeSection !== "odontogram"} role="tabpanel">
        <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)] sm:p-5">
          <OdontogramChart
            encounterId={context.encounter.id}
            entries={context.odontogram.current_entries}
            encounterEntries={context.odontogram.encounter_entries}
            editable={context.is_editable}
          />
        </div>
      </section>

      <section hidden={activeSection !== "prescriptions"} role="tabpanel">
        <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)] sm:p-5">
          <EncounterPrescriptionModule
            encounterId={context.encounter.id}
            prescriptions={context.prescriptions}
            editable={context.is_editable}
          />
        </div>
      </section>

      <section hidden={activeSection !== "patient"} role="tabpanel">
        <div className="grid gap-5 lg:grid-cols-2">
          <MedicalAlertsCard medicalHistory={context.medical_history} />
          <PatientContextCard patient={context.patient} />
        </div>
      </section>

      <section hidden={activeSection !== "history"} role="tabpanel">
        <PreviousEncounters encounters={context.previous_encounters} />
      </section>
    </div>
  );
}
