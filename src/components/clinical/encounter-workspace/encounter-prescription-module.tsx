"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ClipboardList,
  Edit3,
  FileText,
  Loader2,
  Pill,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEncounterPrescriptionAction } from "@/lib/server/prescriptions";
import type { EncounterPrescription } from "@/types/clinical";
import type { PrescriptionItemInput } from "@/lib/validation/prescription";

interface EncounterPrescriptionModuleProps {
  encounterId: string;
  prescriptions: EncounterPrescription[];
  editable: boolean;
}

const emptyItem: PrescriptionItemInput = {
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export function EncounterPrescriptionModule({
  encounterId,
  prescriptions,
  editable,
}: EncounterPrescriptionModuleProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<PrescriptionItemInput[]>([{ ...emptyItem }]);
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, startTransition] = React.useTransition();

  function updateItem(index: number, patch: Partial<PrescriptionItemInput>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSavePrescription(e: React.FormEvent) {
    e.preventDefault();

    // Client validation
    if (items.length === 0) {
      toast.error("Add at least one medicine to the prescription.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].medicineName || !items[i].medicineName.trim()) {
        toast.error(`Medicine name is required for item #${i + 1}.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await saveEncounterPrescriptionAction({
          encounterId,
          notes: notes.trim() || null,
          items: items.map((item) => ({
            medicineName: item.medicineName.trim(),
            dosage: item.dosage?.trim() || undefined,
            frequency: item.frequency?.trim() || undefined,
            duration: item.duration?.trim() || undefined,
            instructions: item.instructions?.trim() || undefined,
          })),
        });

        if (result.error || !result.data) {
          toast.error(result.error || "Failed to create prescription.");
          return;
        }

        toast.success("Prescription issued successfully.");
        // Reset builder fields
        setItems([{ ...emptyItem }]);
        setNotes("");
        // Authoritatively refresh server data
        router.refresh();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "An unexpected error occurred while saving the prescription.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. ISSUE NEW PRESCRIPTION BUILDER                             */}
      {/* ------------------------------------------------------------- */}
      {editable && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-2xs">
          {/* Card Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <Edit3 className="size-4" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Issue New Prescription
                </h2>
                <p className="text-xs text-muted-foreground">
                  Prescribe medications for this clinical consultation.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold">
              In-Progress
            </span>
          </div>

          <form onSubmit={handleSavePrescription} className="space-y-5">
            {/* Medications Section */}
            <div className="space-y-3">
              <h3 className="font-heading text-xs font-bold text-foreground">
                Medications ({items.length})
              </h3>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-2xs"
                  >
                    {/* Item Top Row */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/60">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          Medicine #{index + 1}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={items.length === 1 || isSubmitting}
                        onClick={() => removeItem(index)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Remove medicine #${index + 1}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* 5-Column Grid of Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Column 1: Medicine Name */}
                      <div className="space-y-1">
                        <Label htmlFor={`med-name-${index}`} className="text-[11px] font-semibold text-muted-foreground">
                          Medicine Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`med-name-${index}`}
                          placeholder="e.g. Amoxicillin 500mg, Ibuprofen 400mg"
                          value={item.medicineName}
                          disabled={isSubmitting}
                          onChange={(e) => updateItem(index, { medicineName: e.target.value })}
                          className="h-9 rounded-xl border-border/80 bg-card text-xs"
                          required
                        />
                      </div>

                      {/* Column 2: Dosage */}
                      <div className="space-y-1">
                        <Label htmlFor={`med-dosage-${index}`} className="text-[11px] font-semibold text-muted-foreground">
                          Dosage <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`med-dosage-${index}`}
                          placeholder="e.g. 1 capsule, 10ml"
                          value={item.dosage ?? ""}
                          disabled={isSubmitting}
                          onChange={(e) => updateItem(index, { dosage: e.target.value })}
                          className="h-9 rounded-xl border-border/80 bg-card text-xs"
                        />
                      </div>

                      {/* Column 3: Frequency */}
                      <div className="space-y-1">
                        <Label htmlFor={`med-freq-${index}`} className="text-[11px] font-semibold text-muted-foreground">
                          Frequency <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`med-freq-${index}`}
                          placeholder="e.g. 3 times daily, q8h"
                          value={item.frequency ?? ""}
                          disabled={isSubmitting}
                          onChange={(e) => updateItem(index, { frequency: e.target.value })}
                          className="h-9 rounded-xl border-border/80 bg-card text-xs"
                        />
                      </div>

                      {/* Column 4: Duration */}
                      <div className="space-y-1">
                        <Label htmlFor={`med-dur-${index}`} className="text-[11px] font-semibold text-muted-foreground">
                          Duration <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`med-dur-${index}`}
                          placeholder="e.g. 5 days, 1 week"
                          value={item.duration ?? ""}
                          disabled={isSubmitting}
                          onChange={(e) => updateItem(index, { duration: e.target.value })}
                          className="h-9 rounded-xl border-border/80 bg-card text-xs"
                        />
                      </div>

                      {/* Column 5: Instructions / Directions */}
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor={`med-inst-${index}`} className="text-[11px] font-semibold text-muted-foreground">
                          Instructions / Patient Directions
                        </Label>
                        <Input
                          id={`med-inst-${index}`}
                          placeholder="e.g. Take with food, finish full course"
                          value={item.instructions ?? ""}
                          disabled={isSubmitting}
                          onChange={(e) => updateItem(index, { instructions: e.target.value })}
                          className="h-9 rounded-xl border-border/80 bg-card text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Medicine CTA */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={addItem}
                className="gap-1.5 text-xs font-semibold h-8.5 rounded-xl border-border/80 hover:bg-muted/40"
              >
                <Plus className="size-3.5" />
                Add Medicine
              </Button>
            </div>

            {/* Prescription Notes */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="rx-notes" className="text-[11px] font-semibold text-muted-foreground">
                Prescription Notes (optional)
              </Label>
              <Textarea
                id="rx-notes"
                placeholder="Additional pharmacy notes, clinical precautions, or follow-up directions..."
                value={notes}
                disabled={isSubmitting}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="min-h-[70px] rounded-xl border-border/80 bg-card text-xs resize-y placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Save CTA */}
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 px-5 h-9 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving Prescription...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3.5" />
                    Save Prescription
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PRESCRIPTIONS ISSUED THIS CONSULTATION                     */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0">
              <FileText className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Prescriptions Issued This Consultation
              </h2>
              <p className="text-xs text-muted-foreground">
                Authoritative record of prescriptions issued during this clinical encounter.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold">
            {prescriptions.length} {prescriptions.length === 1 ? "Prescription" : "Prescriptions"}
          </span>
        </div>

        {/* Empty State vs List */}
        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 flex items-center justify-center gap-4 text-left">
            <div className="size-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-foreground">
                No prescriptions issued during this consultation.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {editable
                  ? "Use the form above to add medications and issue a prescription."
                  : "No prescription was recorded for this consultation encounter."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx, rxIndex) => (
              <div
                key={rx.id}
                className="rounded-2xl border border-border/80 bg-card p-4 space-y-3.5 shadow-2xs"
              >
                {/* Rx Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Pill className="size-3.5 text-primary" />
                      Prescription #{rxIndex + 1}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      · Issued {format(new Date(rx.issued_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>

                  {rx.practitioner_name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="size-3" />
                      <span>{rx.practitioner_name}</span>
                    </div>
                  )}
                </div>

                {/* Items Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-left text-[11px]">
                        <th className="pb-2 font-semibold">Medicine</th>
                        <th className="pb-2 font-semibold">Dosage</th>
                        <th className="pb-2 font-semibold">Frequency</th>
                        <th className="pb-2 font-semibold">Duration</th>
                        <th className="pb-2 font-semibold">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {rx.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 font-bold text-foreground">{item.medicine_name}</td>
                          <td className="py-2.5 text-muted-foreground">{item.dosage || "—"}</td>
                          <td className="py-2.5 text-muted-foreground">{item.frequency || "—"}</td>
                          <td className="py-2.5 text-muted-foreground">{item.duration || "—"}</td>
                          <td className="py-2.5 text-muted-foreground">{item.instructions || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Prescription Notes */}
                {rx.notes && (
                  <div className="rounded-xl bg-muted/25 border border-border/50 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold text-[11px] text-foreground mb-0.5">Notes:</p>
                    <p>{rx.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
