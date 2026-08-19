"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type PatientProfileActionState,
  updateOwnPatientProfileAction,
} from "@/lib/server/patient-profile";

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
  };
}

const initialState: PatientProfileActionState = { error: null };

export function PatientProfileForm({ patient }: PatientProfileFormProps) {
  const [state, action, pending] = useActionState(updateOwnPatientProfileAction, initialState);

  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-4">
        <div>
          <legend className="font-heading text-lg font-bold text-foreground">Personal details</legend>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            Keep your identity and contact information accurate for clinic communication.
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
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
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
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
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
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
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
              className="h-11 rounded-2xl border-border/60 bg-muted/40 text-xs text-text-muted cursor-not-allowed shadow-2xs"
            />
            <p className="text-[11px] text-text-muted">Contact reception to change your login email.</p>
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
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
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
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address" className="text-xs font-semibold text-foreground">
              Address
            </Label>
            <Textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={patient.address ?? ""}
              className="rounded-2xl border-border/80 bg-background-subtle/70 text-xs leading-relaxed shadow-2xs resize-none focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-border/60 pt-6 space-y-4">
        <div>
          <legend className="font-heading text-lg font-bold text-foreground">Emergency contact</legend>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            A trusted person the clinic may contact if urgent support is required.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="emergencyContactName" className="text-xs font-semibold text-foreground">
              Contact name
            </Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={patient.emergency_contact_name ?? ""}
              required
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold text-foreground">
              Contact phone
            </Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              defaultValue={patient.emergency_contact_phone ?? ""}
              required
              className="h-11 rounded-2xl border-border/80 bg-background-subtle/70 text-xs shadow-2xs focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          {state.message}
        </p>
      )}

      <div className="flex justify-end border-t border-border/60 pt-5">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20 font-bold text-xs h-11 px-7"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
