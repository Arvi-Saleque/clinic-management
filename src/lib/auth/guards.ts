import "server-only";
import { redirect } from "next/navigation";

import { getProfile } from "@/lib/auth/session";
import { CLINICIAN_ROLES, STAFF_ROLES, type Role } from "@/lib/constants/roles";
import type { Profile } from "@/lib/auth/session";

/**
 * Redirects to /login if signed out, or to that role's own home if signed
 * in but not permitted — never renders the protected page for a
 * mismatched role. Call at the top of a route group's layout.
 */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role as Role)) {
    redirect(profile.role === "patient" ? "/portal/dashboard" : "/dashboard");
  }

  return profile;
}

export async function requireStaff() {
  return requireRole(STAFF_ROLES);
}

/** Dentist/owner_admin only — clinical write actions (prescriptions, odontogram). */
export async function requireClinician() {
  return requireRole(CLINICIAN_ROLES);
}

export async function requirePatient() {
  return requireRole(["patient"]);
}
