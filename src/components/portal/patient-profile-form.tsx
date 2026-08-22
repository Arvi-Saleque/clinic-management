"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  HeartPulse,
  Info,
  Loader2,
  Pill,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type PatientProfileActionState,
  updateOwnPatientProfileAction,
} from "@/lib/server/patient-profile";
import { cn } from "@/lib/utils";

interface PatientProfileFormProps {
  patient: {
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
    dob: string | null;
    gender: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    medical_history?: {
      allergies: string[];
      current_medications: string[];
      chronic_conditions: string[];
      past_surgeries: string | null;
      notes: string | null;
    } | null;
  };
}

const COMMON_ALLERGIES = [
  "Penicillin",
  "Latex",
  "Aspirin",
  "Local Anesthesia",
  "Sulfa Drugs",
  "Codeine",
  "Ibuprofen / NSAIDs",
  "No Known Allergies",
];

const COMMON_CONDITIONS = [
  "Hypertension / High BP",
  "Diabetes (Type 1 or 2)",
  "Heart Condition / Pacemaker",
  "Asthma",
  "Bleeding Disorder / Hemophilia",
  "Epilepsy / Seizures",
  "None",
];

const COMMON_MEDICATIONS = [
  "Blood Thinners (Aspirin/Warfarin)",
  "Blood Pressure Meds",
  "Insulin / Diabetes Meds",
  "Inhaler / Asthma Meds",
  "Painkillers",
  "None",
];

const initialState: PatientProfileActionState = { error: null };

export function PatientProfileForm({ patient }: PatientProfileFormProps) {
  const [state, action, pending] = useActionState(updateOwnPatientProfileAction, initialState);

  // Active section tab
  const [activeTab, setActiveTab] = React.useState<"health" | "personal">("health");

  // Medical History interactive state
  const [allergies, setAllergies] = React.useState<string[]>(
    patient.medical_history?.allergies ?? [],
  );
  const [customAllergy, setCustomAllergy] = React.useState("");

  const [conditions, setConditions] = React.useState<string[]>(
    patient.medical_history?.chronic_conditions ?? [],
  );
  const [customCondition, setCustomCondition] = React.useState("");

  const [medications, setMedications] = React.useState<string[]>(
    patient.medical_history?.current_medications ?? [],
  );
  const [customMedication, setCustomMedication] = React.useState("");

  // Allergy helpers
  const toggleAllergy = (item: string) => {
    if (item === "No Known Allergies") {
      setAllergies((prev) => (prev.includes("No Known Allergies") ? [] : ["No Known Allergies"]));
      return;
    }
    setAllergies((prev) => {
      const filtered = prev.filter((a) => a !== "No Known Allergies");
      return filtered.includes(item) ? filtered.filter((a) => a !== item) : [...filtered, item];
    });
  };

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies((prev) => [...prev.filter((a) => a !== "No Known Allergies"), trimmed]);
      setCustomAllergy("");
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies((prev) => prev.filter((a) => a !== item));
  };

  // Condition helpers
  const toggleCondition = (item: string) => {
    if (item === "None") {
      setConditions((prev) => (prev.includes("None") ? [] : ["None"]));
      return;
    }
    setConditions((prev) => {
      const filtered = prev.filter((c) => c !== "None");
      return filtered.includes(item) ? filtered.filter((c) => c !== item) : [...filtered, item];
    });
  };

  const addCustomCondition = () => {
    const trimmed = customCondition.trim();
    if (trimmed && !conditions.includes(trimmed)) {
      setConditions((prev) => [...prev.filter((c) => c !== "None"), trimmed]);
      setCustomCondition("");
    }
  };

  const removeCondition = (item: string) => {
    setConditions((prev) => prev.filter((c) => c !== item));
  };

  // Medication helpers
  const toggleMedication = (item: string) => {
    if (item === "None") {
      setMedications((prev) => (prev.includes("None") ? [] : ["None"]));
      return;
    }
    setMedications((prev) => {
      const filtered = prev.filter((m) => m !== "None");
      return filtered.includes(item) ? filtered.filter((m) => m !== item) : [...filtered, item];
    });
  };

  const addCustomMedication = () => {
    const trimmed = customMedication.trim();
    if (trimmed && !medications.includes(trimmed)) {
      setMedications((prev) => [...prev.filter((m) => m !== "None"), trimmed]);
      setCustomMedication("");
    }
  };

  const removeMedication = (item: string) => {
    setMedications((prev) => prev.filter((m) => m !== item));
  };

  return (
    <form action={action} className="space-y-6">
      {/* ── Hidden serializations for array fields ── */}
      <input type="hidden" name="allergies" value={JSON.stringify(allergies)} />
      <input type="hidden" name="chronicConditions" value={JSON.stringify(conditions)} />
      <input type="hidden" name="currentMedications" value={JSON.stringify(medications)} />

      {/* ── Section Navigation Switcher ── */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-border/80 bg-muted/25 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("health")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all cursor-pointer",
            activeTab === "health"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40",
          )}
        >
          <HeartPulse className="size-4 text-primary" />
          <span>Health &amp; Medical Safety</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all cursor-pointer",
            activeTab === "personal"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40",
          )}
        >
          <User className="size-4 text-primary" />
          <span>Personal &amp; Contact Details</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: HEALTH & MEDICAL SAFETY (Directly Editable by Patient) ─────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div className={cn("space-y-6", activeTab !== "health" && "hidden")}>
        {/* Info Banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-foreground">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-primary">Directly Editable Health Profile</p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Keep your medical details up-to-date so your dentist can tailor treatments, anesthesia, and prescriptions safely to your health condition.
            </p>
          </div>
        </div>

        {/* 1. Allergies Section */}
        <div className="rounded-3xl border border-border/80 bg-background/60 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">Allergies &amp; Sensitivities</h3>
                <p className="text-[11px] text-muted-foreground">Select known drug or material allergies</p>
              </div>
            </div>
            {allergies.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                {allergies.length} recorded
              </span>
            )}
          </div>

          {/* Quick toggle chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Quick Selection
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map((item) => {
                const isSelected = allergies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergy(item)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "border-destructive/40 bg-destructive/15 text-destructive shadow-2xs font-bold"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {isSelected && <Check className="size-3 shrink-0" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Add Specific Allergy
            </label>
            <div className="flex gap-2">
              <Input
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomAllergy();
                  }
                }}
                placeholder="Type allergy name (e.g. Erythromycin, Nickel) and press Add..."
                className="h-9.5 rounded-xl border-border/80 bg-background text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomAllergy}
                className="h-9.5 rounded-xl px-3.5 text-xs font-bold shrink-0"
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Active Allergy Tags */}
          {allergies.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Active Allergy List
              </span>
              <div className="flex flex-wrap gap-2">
                {allergies.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive shadow-2xs"
                  >
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(item)}
                      className="ml-1 text-destructive/70 hover:text-destructive cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Chronic Health Conditions Section */}
        <div className="rounded-3xl border border-border/80 bg-background/60 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                <Activity className="size-4" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">Chronic Conditions &amp; Medical History</h3>
                <p className="text-[11px] text-muted-foreground">Conditions relevant to dental surgeries &amp; anesthesia</p>
              </div>
            </div>
            {conditions.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                {conditions.length} recorded
              </span>
            )}
          </div>

          {/* Quick toggle chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Quick Selection
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.map((item) => {
                const isSelected = conditions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleCondition(item)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "border-violet-400 bg-violet-500/15 text-violet-800 dark:text-violet-200 shadow-2xs font-bold"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {isSelected && <Check className="size-3 shrink-0" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Condition Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Add Specific Condition
            </label>
            <div className="flex gap-2">
              <Input
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomCondition();
                  }
                }}
                placeholder="Type condition name (e.g. Thyroid disorder, Kidney disease)..."
                className="h-9.5 rounded-xl border-border/80 bg-background text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomCondition}
                className="h-9.5 rounded-xl px-3.5 text-xs font-bold shrink-0"
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Active Condition Tags */}
          {conditions.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Active Conditions List
              </span>
              <div className="flex flex-wrap gap-2">
                {conditions.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300/60 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-800 dark:text-violet-200 shadow-2xs"
                  >
                    <Activity className="size-3 shrink-0" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeCondition(item)}
                      className="ml-1 text-violet-700/70 hover:text-violet-900 dark:text-violet-300 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Current Medications Section */}
        <div className="rounded-3xl border border-border/80 bg-background/60 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <Pill className="size-4" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">Current Medications</h3>
                <p className="text-[11px] text-muted-foreground">Prescribed or regular medications you are currently taking</p>
              </div>
            </div>
            {medications.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {medications.length} recorded
              </span>
            )}
          </div>

          {/* Quick toggle chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Quick Selection
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MEDICATIONS.map((item) => {
                const isSelected = medications.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleMedication(item)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "border-blue-400 bg-blue-500/15 text-blue-800 dark:text-blue-200 shadow-2xs font-bold"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {isSelected && <Check className="size-3 shrink-0" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Medication Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Add Specific Medication
            </label>
            <div className="flex gap-2">
              <Input
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomMedication();
                  }
                }}
                placeholder="Type medication name (e.g. Metformin 500mg, Lisinopril)..."
                className="h-9.5 rounded-xl border-border/80 bg-background text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomMedication}
                className="h-9.5 rounded-xl px-3.5 text-xs font-bold shrink-0"
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Active Medication Tags */}
          {medications.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Active Medications List
              </span>
              <div className="flex flex-wrap gap-2">
                {medications.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300/60 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-800 dark:text-blue-200 shadow-2xs"
                  >
                    <Pill className="size-3 shrink-0" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeMedication(item)}
                      className="ml-1 text-blue-700/70 hover:text-blue-900 dark:text-blue-300 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Past Surgeries & Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border/80 bg-background/60 p-4.5 space-y-2 shadow-2xs">
            <Label htmlFor="pastSurgeries" className="text-xs font-bold text-foreground block">
              Past Surgeries or Major Hospitalizations
            </Label>
            <Textarea
              id="pastSurgeries"
              name="pastSurgeries"
              rows={3}
              defaultValue={patient.medical_history?.past_surgeries ?? ""}
              placeholder="e.g. Wisdom teeth extraction (2022), Appendectomy, Heart surgery..."
              className="rounded-2xl border-border/80 bg-background text-xs leading-relaxed resize-none shadow-2xs"
            />
          </div>

          <div className="rounded-3xl border border-border/80 bg-background/60 p-4.5 space-y-2 shadow-2xs">
            <Label htmlFor="medicalNotes" className="text-xs font-bold text-foreground block">
              Additional Medical or Dental Notes
            </Label>
            <Textarea
              id="medicalNotes"
              name="medicalNotes"
              rows={3}
              defaultValue={patient.medical_history?.notes ?? ""}
              placeholder="Any dental anxiety, previous local anesthesia reactions, or special care requests..."
              className="rounded-2xl border-border/80 bg-background text-xs leading-relaxed resize-none shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: PERSONAL & CONTACT DETAILS ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div className={cn("space-y-6", activeTab !== "personal" && "hidden")}>
        <fieldset className="space-y-4">
          <div>
            <legend className="font-heading text-base font-bold text-foreground">Identity &amp; Contact</legend>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Keep your contact information up-to-date for appointment reminders and notifications.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold text-foreground">
                First name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={patient.first_name}
                required
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold text-foreground">
                Last name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={patient.last_name}
                required
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Phone number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={patient.phone ?? ""}
                required
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                value={patient.email ?? ""}
                disabled
                className="h-10.5 rounded-2xl border-border/60 bg-muted/40 text-xs text-muted-foreground cursor-not-allowed shadow-2xs"
              />
              <p className="text-[10px] text-muted-foreground">Contact reception to change your registered email.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-semibold text-foreground">
                Date of birth
              </Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                defaultValue={patient.dob ?? ""}
                required
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-semibold text-foreground">
                Gender
              </Label>
              <Input
                id="gender"
                name="gender"
                defaultValue={patient.gender ?? ""}
                placeholder="e.g. Female, Male, Non-binary..."
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                Residential Address
              </Label>
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={patient.address ?? ""}
                placeholder="Full street address, apartment, city, and postal code..."
                className="rounded-2xl border-border/80 bg-background text-xs leading-relaxed shadow-2xs resize-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Emergency Contact */}
        <fieldset className="border-t border-border/60 pt-5 space-y-4">
          <div>
            <legend className="font-heading text-base font-bold text-foreground">Emergency Contact</legend>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A trusted relative or friend to contact in an urgent situation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactName" className="text-xs font-semibold text-foreground">
                Contact full name
              </Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                defaultValue={patient.emergency_contact_name ?? ""}
                required
                placeholder="e.g. Sarah Jenkins"
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold text-foreground">
                Contact phone number
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                defaultValue={patient.emergency_contact_phone ?? ""}
                required
                placeholder="e.g. +1 (555) 019-2834"
                className="h-10.5 rounded-2xl border-border/80 bg-background text-xs shadow-2xs font-mono"
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* ── Status Alerts ── */}
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state.message && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* ── Save Action Button ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-5">
        <p className="text-[11px] text-muted-foreground">
          All modifications are saved securely to your authoritative dental health record.
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-md font-bold text-xs h-11 px-8 cursor-pointer"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Saving Changes..." : "Save Health & Personal Profile"}
        </Button>
      </div>
    </form>
  );
}
