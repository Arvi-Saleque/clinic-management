"use client";

import { useState } from "react";
import {
  Pill,
  Smile,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function EncounterWorkspace({ context }: EncounterWorkspaceProps) {
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner: Status, Doctor attribution, Mode badge & Quick Actions */}
      <EncounterHeader context={context} isDirty={isDraftDirty} />

      {/* Main Workspace Layout: 12-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Clinical Encounter Workspace / Draft Form (7 cols on lg, 8 cols on xl) */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {context.is_editable ? (
            /* In-Progress: Live Editable Draft Form */
            <EncounterDraftForm
              encounter={context.encounter}
              privateNotes={context.private_notes}
              onDirtyChange={setIsDraftDirty}
            />
          ) : (
            /* Completed / Read-only: Structured Historical Consultation Summary */
            <ClinicalDocumentationSummary
              encounter={context.encounter}
              privateNotes={context.private_notes}
              patient={context.patient}
              followUpScheduling={context.follow_up_scheduling}
              followUpAppointments={context.follow_up_appointments}
              isEditable={false}
            />
          )}

          {/* Clinical Modules (Dental Chart / Prescriptions) */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Clinical Modules & Integrations
                </CardTitle>
                <Badge
                  variant={context.is_editable ? "default" : "outline"}
                  className="text-xs font-normal"
                >
                  {context.is_editable ? "Active Consultation" : "Historical Record"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="odontogram" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="odontogram" className="gap-1.5">
                    <Smile className="size-4" />
                    <span>Dental Chart / Odontogram</span>
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="gap-1.5">
                    <Pill className="size-4" />
                    <span>Prescriptions</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="odontogram" className="mt-4">
                  <OdontogramChart
                    encounterId={context.encounter.id}
                    entries={context.odontogram.current_entries}
                    encounterEntries={context.odontogram.encounter_entries}
                    editable={context.is_editable}
                  />
                </TabsContent>

                <TabsContent value="prescriptions" className="mt-4">
                  <EncounterPrescriptionModule
                    encounterId={context.encounter.id}
                    prescriptions={context.prescriptions}
                    editable={context.is_editable}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Historical Previous Encounters */}
          <PreviousEncounters encounters={context.previous_encounters} />
        </div>

        {/* Right Column: Sticky Patient, Medical & Appointment Context (5 cols on lg, 4 cols on xl) */}
        <aside className="space-y-6 lg:col-span-5 xl:col-span-4">
          <MedicalAlertsCard medicalHistory={context.medical_history} />
          <PatientContextCard patient={context.patient} />
          <AppointmentContextCard appointment={context.appointment} />
        </aside>
      </div>
    </div>
  );
}
