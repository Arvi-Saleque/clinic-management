export const ROLES = {
  OWNER_ADMIN: "owner_admin",
  RECEPTIONIST: "receptionist",
  DENTIST: "dentist",
  PATIENT: "patient",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: Role[] = [ROLES.OWNER_ADMIN, ROLES.RECEPTIONIST, ROLES.DENTIST];
export const CLINICIAN_ROLES: Role[] = [ROLES.OWNER_ADMIN, ROLES.DENTIST];

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.OWNER_ADMIN]: "Owner Admin",
  [ROLES.RECEPTIONIST]: "Receptionist",
  [ROLES.DENTIST]: "Dentist",
  [ROLES.PATIENT]: "Patient",
};

export function formatRoleLabel(role?: string | null): string {
  if (!role) return "Staff";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
