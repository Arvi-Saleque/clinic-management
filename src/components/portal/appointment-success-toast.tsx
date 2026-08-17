"use client";

import * as React from "react";
import { toast } from "sonner";

export function AppointmentSuccessToast({ success }: { success?: string }) {
  React.useEffect(() => {
    if (!success) return;

    if (success === "booked") {
      toast.success("Appointment booked successfully.");
    } else if (success === "rescheduled") {
      toast.success("Appointment rescheduled successfully.");
    }

    // Strip success parameter from URL so browser refresh does not re-trigger the toast
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, [success]);

  return null;
}
