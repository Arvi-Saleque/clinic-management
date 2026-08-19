"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPatientByStaffAction, type PatientAdminInput } from "@/lib/server/patients";

interface NewPatientDialogProps {
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function NewPatientDialog({
  triggerClassName,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger = false,
}: NewPatientDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [formData, setFormData] = React.useState<PatientAdminInput>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      dob: "",
      gender: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formData.dob) {
      toast.error("Date of birth is required");
      return;
    }

    setSubmitting(true);
    const res = await createPatientByStaffAction(formData);
    setSubmitting(false);

    if (res.success && res.patientId) {
      toast.success("Patient registered successfully");
      setOpen(false);
      reset();
      router.push(`/patients/${res.patientId}`);
    } else {
      toast.error(res.error ?? "Failed to create patient");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button
              type="button"
              className={
                triggerClassName ||
                "h-9.5 gap-1.5 rounded-xl px-3.5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs"
              }
            >
              <Plus className="size-3.5" />
              Register Patient
            </Button>
          }
        />
      )}
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold font-heading">
              Register New Patient
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter administrative demographics and contact details to create a patient profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-firstName" className="text-xs font-semibold">
                First Name *
              </Label>
              <Input
                id="new-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="e.g. Ayesha"
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-lastName" className="text-xs font-semibold">
                Last Name *
              </Label>
              <Input
                id="new-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="e.g. Rahman"
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-phone" className="text-xs font-semibold">
                Phone Number *
              </Label>
              <Input
                id="new-phone"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 01711000000"
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="text-xs font-semibold">
                Email Address <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="new-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g. ayesha@example.com"
                className="h-9.5 rounded-xl border-border/80 text-xs"
              />
            </div>
          </div>

          {/* Demographics Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-dob" className="text-xs font-semibold">
                Date of Birth *
              </Label>
              <Input
                id="new-dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData((p) => ({ ...p, dob: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-gender" className="text-xs font-semibold">
                Gender
              </Label>
              <Select
                value={formData.gender || "unspecified"}
                onValueChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    gender: val && val !== "unspecified" ? val : undefined,
                  }))
                }
              >
                <SelectTrigger id="new-gender" className="h-9.5 rounded-xl border-border/80 text-xs">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified" className="text-xs">Not specified</SelectItem>
                  <SelectItem value="male" className="text-xs">Male</SelectItem>
                  <SelectItem value="female" className="text-xs">Female</SelectItem>
                  <SelectItem value="other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="new-address" className="text-xs font-semibold">
              Residential Address <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="new-address"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. Apt 4B, Dhanmondi, Dhaka"
              className="h-9.5 rounded-xl border-border/80 text-xs"
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-emergencyContactName" className="text-xs font-semibold">
                Emergency Contact Name
              </Label>
              <Input
                id="new-emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, emergencyContactName: e.target.value }))
                }
                placeholder="e.g. Spouse / Parent"
                className="h-9.5 rounded-xl border-border/80 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-emergencyContactPhone" className="text-xs font-semibold">
                Emergency Contact Phone
              </Label>
              <Input
                id="new-emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, emergencyContactPhone: e.target.value }))
                }
                placeholder="Phone number"
                className="h-9.5 rounded-xl border-border/80 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-9 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-9 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Registering…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Complete Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
