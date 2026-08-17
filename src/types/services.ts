export interface ClinicService {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  is_active: boolean;
  show_on_website: boolean;
  created_at: string;
}

export interface DoctorServiceConfig {
  service_id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  clinic_duration_minutes: number;
  clinic_price: number;
  is_offered: boolean;
  override_duration_minutes: number | null;
  effective_duration_minutes: number;
  override_price: number | null;
  effective_price: number;
}

export interface DoctorServicesContext {
  practitioner: {
    id: string;
    title: string | null;
    full_name: string;
    branch_id: string;
  } | null;
  allPractitioners: {
    id: string;
    title: string | null;
    full_name: string;
  }[];
  canSelectPractitioner: boolean;
  services: DoctorServiceConfig[];
}

export interface ServicePractitionerOption {
  id: string;
  practitioner_id: string;
  doctor_name: string;
  title: string | null;
  branch_id: string;
  service_id: string;
  effective_duration_minutes: number;
  base_duration_minutes: number;
  override_duration_minutes: number | null;
  effective_price: number;
  base_price: number;
  override_price: number | null;
  profiles: { full_name: string } | null;
}

