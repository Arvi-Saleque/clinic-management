export const ROLES = {
  OWNER_ADMIN: "owner_admin",
  RECEPTIONIST: "receptionist",
  DENTIST: "dentist",
  PATIENT: "patient",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: Role[] = [ROLES.OWNER_ADMIN, ROLES.RECEPTIONIST, ROLES.DENTIST];
export const CLINICIAN_ROLES: Role[] = [ROLES.OWNER_ADMIN, ROLES.DENTIST];
