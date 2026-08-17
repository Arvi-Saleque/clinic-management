"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Clock,
  FileText,
  Loader2,
  Pill,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEncounterPrescriptionAction } from "@/lib/server/prescriptions";
import type { EncounterPrescription, EncounterPrescriptionItem } from "@/types/clinical";
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
      {/* 1. In-Progress Prescription Builder */}
      {editable && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Pill className="size-4 text-primary" />
                  Issue New Prescription
                </CardTitle>
                <CardDescription className="text-xs">
                  Prescribe medications for this clinical consultation. Multiple prescriptions can be issued if needed.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                In-Progress
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSavePrescription} className="space-y-5">
              {/* Medication Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Medications ({items.length})
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    * Medicine Name is required for each line item
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border/80 bg-muted/20 p-4 transition-colors hover:border-border"
                    >
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            {index + 1}
                          </span>
                          Medicine #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={items.length === 1 || isSubmitting}
                          onClick={() => removeItem(index)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-7"
                          aria-label={`Remove medicine #${index + 1}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`med-name-${index}`} className="text-xs font-medium">
                            Medicine Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`med-name-${index}`}
                            placeholder="e.g. Amoxicillin 500mg, Ibuprofen 400mg"
                            value={item.medicineName}
                            disabled={isSubmitting}
                            onChange={(e) => updateItem(index, { medicineName: e.target.value })}
                            className="mt-1 h-9 rounded-lg bg-background text-xs"
                            required
                          />
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-3">
                          <div>
                            <Label htmlFor={`med-dosage-${index}`} className="text-xs font-medium">
                              Dosage
                            </Label>
                            <Input
                              id={`med-dosage-${index}`}
                              placeholder="e.g. 1 capsule, 10ml"
                              value={item.dosage ?? ""}
                              disabled={isSubmitting}
                              onChange={(e) => updateItem(index, { dosage: e.target.value })}
                              className="mt-1 h-9 rounded-lg bg-background text-xs"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`med-freq-${index}`} className="text-xs font-medium">
                              Frequency
                            </Label>
                            <Input
                              id={`med-freq-${index}`}
                              placeholder="e.g. 3 times daily, q8h"
                              value={item.frequency ?? ""}
                              disabled={isSubmitting}
                              onChange={(e) => updateItem(index, { frequency: e.target.value })}
                              className="mt-1 h-9 rounded-lg bg-background text-xs"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`med-dur-${index}`} className="text-xs font-medium">
                              Duration
                            </Label>
                            <Input
                              id={`med-dur-${index}`}
                              placeholder="e.g. 5 days, 1 week"
                              value={item.duration ?? ""}
                              disabled={isSubmitting}
                              onChange={(e) => updateItem(index, { duration: e.target.value })}
                              className="mt-1 h-9 rounded-lg bg-background text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`med-inst-${index}`} className="text-xs font-medium">
                            Instructions / Patient Directions
                          </Label>
                          <Input
                            id={`med-inst-${index}`}
                            placeholder="e.g. Take with food, finish full course"
                            value={item.instructions ?? ""}
                            disabled={isSubmitting}
                            onChange={(e) => updateItem(index, { instructions: e.target.value })}
                            className="mt-1 h-9 rounded-lg bg-background text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={addItem}
                  className="gap-1.5 text-xs font-medium h-8"
                >
                  <Plus className="size-3.5" />
                  Add Medicine
                </Button>
              </div>

              {/* Prescription Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="rx-notes" className="text-xs font-medium">
                  Prescription Notes (optional)
                </Label>
                <Textarea
                  id="rx-notes"
                  placeholder="Additional pharmacy notes, clinical precautions, or follow-up directions..."
                  value={notes}
                  disabled={isSubmitting}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="rounded-lg bg-background text-xs resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 px-5 h-9 rounded-lg text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving Prescription...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Save Prescription
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. Prescriptions Issued This Consultation */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Prescriptions Issued This Consultation
              </CardTitle>
              <CardDescription className="text-xs">
                Authoritative record of prescriptions issued during this clinical encounter.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {prescriptions.length} {prescriptions.length === 1 ? "Prescription" : "Prescriptions"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 p-8 text-center">
              <Pill className="size-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-sm text-foreground">
                No prescriptions issued during this consultation.
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {editable
                  ? "Use the form above to add medications and issue a prescription."
                  : "No prescription was recorded for this consultation encounter."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx, rxIndex) => (
                <div
                  key={rx.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-xs"
                >
                  {/* Header: Rx #, Date, Doctor, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Pill className="size-3.5 text-primary" />
                        Prescription #{rxIndex + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground/70" />
                        {rx.issued_at
                          ? format(new Date(rx.issued_at), "MMM d, yyyy · h:mm a")
                          : "Issued during encounter"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rx.practitioner_name && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <User className="size-3 text-muted-foreground/70" />
                          Dr. {rx.practitioner_name}
                        </span>
                      )}
                      <Badge
                        variant={rx.status === "active" ? "default" : "outline"}
                        className="text-[10px] capitalize font-medium py-0 h-5"
                      >
                        {rx.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Notes if present */}
                  {rx.notes && (
                    <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground border border-border/40">
                      <span className="font-semibold text-foreground mr-1.5">Notes:</span>
                      {rx.notes}
                    </div>
                  )}

                  {/* Medication Items List */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Medication Details ({rx.items.length})
                    </Label>

                    <div className="overflow-x-auto rounded-lg border border-border/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground border-b border-border/80">
                          <tr>
                            <th className="px-3 py-2">Medicine</th>
                            <th className="px-3 py-2">Dosage</th>
                            <th className="px-3 py-2">Frequency</th>
                            <th className="px-3 py-2">Duration</th>
                            <th className="px-3 py-2">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {rx.items.map((item: EncounterPrescriptionItem) => (
                            <tr key={item.id} className="hover:bg-muted/20">
                              <td className="px-3 py-2.5 font-semibold text-foreground">
                                {item.medicine_name}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {item.dosage || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {item.frequency || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {item.duration || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {item.instructions || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
