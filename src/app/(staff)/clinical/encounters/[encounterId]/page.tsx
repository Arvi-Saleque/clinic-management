import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EncounterWorkspace } from "@/components/clinical/encounter-workspace/encounter-workspace";
import { getEncounterWorkspaceContext } from "@/lib/server/encounters";

interface PageProps {
  params: Promise<{ encounterId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { encounterId } = await params;
  const result = await getEncounterWorkspaceContext(encounterId);

  if (!result.data) {
    return {
      title: "Consultation Workspace | Dental Clinic",
    };
  }

  return {
    title: `Consultation: ${result.data.patient.full_name} (${result.data.patient.patient_reference})`,
  };
}

export default async function ClinicalEncounterWorkspacePage({
  params,
}: PageProps) {
  const { encounterId } = await params;
  const result = await getEncounterWorkspaceContext(encounterId);

  if (result.error === "not_found") {
    notFound();
  }

  if (result.error === "load_failed" || !result.data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Unable to Load Consultation Workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.message || "An unexpected error occurred while loading this consultation record. Please try again or return to the scheduler."}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <ButtonLink
            href="/scheduler"
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Scheduler</span>
          </ButtonLink>
          <ButtonLink
            href={`/clinical/encounters/${encounterId}`}
            variant="default"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className="size-4" />
            <span>Retry</span>
          </ButtonLink>
        </div>
      </div>
    );
  }

  return <EncounterWorkspace context={result.data} />;
}
