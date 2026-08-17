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
    <form action={action} className="space-y-7">
      <fieldset>
        <legend className="font-heading text-lg font-bold">Personal details</legend>
        <p className="mt-1 text-xs text-text-muted">Keep your identity and contact information accurate for clinic communication.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" defaultValue={patient.first_name} required /></div>
          <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" defaultValue={patient.last_name} required /></div>
          <div className="space-y-2"><Label htmlFor="phone">Phone number</Label><Input id="phone" name="phone" type="tel" defaultValue={patient.phone ?? ""} required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" value={patient.email ?? ""} disabled /><p className="text-[11px] text-text-muted">Contact reception to change your login email.</p></div>
          <div className="space-y-2"><Label htmlFor="dob">Date of birth</Label><Input id="dob" name="dob" type="date" defaultValue={patient.dob ?? ""} required /></div>
          <div className="space-y-2"><Label htmlFor="gender">Gender</Label><Input id="gender" name="gender" defaultValue={patient.gender ?? ""} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" rows={3} defaultValue={patient.address ?? ""} /></div>
        </div>
      </fieldset>

      <fieldset className="border-t border-border pt-7">
        <legend className="font-heading text-lg font-bold">Emergency contact</legend>
        <p className="mt-1 text-xs text-text-muted">A trusted person the clinic may contact if urgent support is required.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="emergencyContactName">Contact name</Label><Input id="emergencyContactName" name="emergencyContactName" defaultValue={patient.emergency_contact_name ?? ""} required /></div>
          <div className="space-y-2"><Label htmlFor="emergencyContactPhone">Contact phone</Label><Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" defaultValue={patient.emergency_contact_phone ?? ""} required /></div>
        </div>
      </fieldset>

      {state.error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>}
      {state.message && <p role="status" className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success"><CheckCircle2 className="size-4" />{state.message}</p>}

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" size="lg" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
