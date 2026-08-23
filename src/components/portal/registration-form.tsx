"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  registerPatientAction,
  registerPatientForBookingAction,
  type RegistrationActionState,
} from "@/lib/server/registration";

const initialState: RegistrationActionState = { error: null };

export function RegistrationForm({
  mode = "page",
  onSuccess,
}: {
  mode?: "page" | "booking";
  onSuccess?: () => void;
}) {
  const action = mode === "booking" ? registerPatientForBookingAction : registerPatientAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const successHandled = React.useRef(false);

  React.useEffect(() => {
    if (!state.registered || successHandled.current) return;
    successHandled.current = true;
    onSuccess?.();
  }, [state.registered, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-semibold">Contact details</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" type="tel" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Input id="gender" name="gender" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address (optional)</Label>
          <Textarea id="address" name="address" rows={2} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-semibold">Emergency contact</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input id="emergencyContactName" name="emergencyContactName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" required />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-semibold">Medical history</legend>
        <p className="text-xs text-muted-foreground">Separate multiple entries with commas.</p>
        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Input id="allergies" name="allergies" placeholder="e.g. Penicillin, Latex" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentMedications">Current medications</Label>
          <Input id="currentMedications" name="currentMedications" placeholder="e.g. Metformin 500mg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chronicConditions">Chronic conditions</Label>
          <Input id="chronicConditions" name="chronicConditions" placeholder="e.g. Diabetes, Hypertension" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pastSurgeries">Past surgeries (optional)</Label>
          <Textarea id="pastSurgeries" name="pastSurgeries" rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Anything else we should know? (optional)</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {mode === "booking" ? "Save details & confirm appointment" : "Complete registration"}
      </Button>
    </form>
  );
}
