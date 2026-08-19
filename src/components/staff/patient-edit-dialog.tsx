"use client";

import * as React from "react";
import { Loader2, UserCheck, UserPen } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePatientAdministrativeAction, type PatientAdminInput } from "@/lib/server/patients";

interface PatientEditDialogProps {
  patientId: string;
  initialData: {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PatientEditDialog({
  patientId,
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: PatientEditDialogProps) {
  const [formData, setFormData] = React.useState<PatientAdminInput>({
    firstName: initialData.first_name || "",
    lastName: initialData.last_name || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    dob: initialData.dob || "",
    gender: initialData.gender || "",
    address: initialData.address || "",
    emergencyContactName: initialData.emergency_contact_name || "",
    emergencyContactPhone: initialData.emergency_contact_phone || "",
  });

  const [submitting, setSubmitting] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setFormData({
        firstName: initialData.first_name || "",
        lastName: initialData.last_name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        dob: initialData.dob || "",
        gender: initialData.gender || "",
        address: initialData.address || "",
        emergencyContactName: initialData.emergency_contact_name || "",
        emergencyContactPhone: initialData.emergency_contact_phone || "",
      });
    }
  }, [open, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    const res = await updatePatientAdministrativeAction(patientId, formData);
    setSubmitting(false);

    if (res.success) {
      toast.success("Patient details updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(res.error ?? "Failed to update patient");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPen className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold font-heading">
              Edit Patient Details
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Update contact and administrative demographics for this patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
              />
            </div>
          </div>

          {/* Demographics Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-semibold">
                Date of Birth *
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData((p) => ({ ...p, dob: e.target.value }))}
                className="h-9.5 rounded-xl border-border/80 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-semibold">
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
                <SelectTrigger id="gender" className="h-9.5 rounded-xl border-border/80 text-xs">
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
            <Label htmlFor="address" className="text-xs font-semibold">
              Residential Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="House, Street, City"
              className="h-9.5 rounded-xl border-border/80 text-xs"
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactName" className="text-xs font-semibold">
                Emergency Contact Name
              </Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, emergencyContactName: e.target.value }))
                }
                placeholder="e.g. Spouse / Parent"
                className="h-9.5 rounded-xl border-border/80 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergencyContactPhone"
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
              onClick={() => onOpenChange(false)}
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
                  Saving…
                </>
              ) : (
                <>
                  <UserCheck className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
