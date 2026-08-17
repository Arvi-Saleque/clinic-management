export type EncounterStatus = "in_progress" | "completed" | "cancelled";

export interface ClinicalEncounter {
  id: string;
  organization_id: string;
  patient_id: string;
  practitioner_id: string;
  appointment_id: string | null;
  status: EncounterStatus;
  chief_complaint: string | null;
  diagnosis: string | null;
  performed_treatment: string | null;
  patient_notes: string | null;
  follow_up_recommended: boolean;
  follow_up_date: string | null;
  follow_up_reason: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalEncounterPrivateNotes {
  encounter_id: string;
  organization_id: string;
  clinical_notes: string;
  created_at: string;
  updated_at: string;
}

export interface EncounterSummary {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: EncounterStatus;
  diagnosis: string | null;
  performed_treatment: string | null;
  follow_up_recommended: boolean;
  follow_up_date: string | null;
  practitioner_name?: string;
  service_booked?: string;
}

export type ConsultationMode = "started" | "resumed" | "readonly";

export interface StartOrResumeEncounterResult {
  success: true;
  encounter_id: string;
  encounter_status: "in_progress" | "completed";
  appointment_id: string;
  appointment_status: "checked_in" | "completed";
  mode: ConsultationMode;
}

export type StartOrResumeEncounterActionResult =
  | { data: StartOrResumeEncounterResult; error: null }
  | { data: null; error: string };

export interface EncounterWorkspacePatient {
  id: string;
  patient_reference: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface EncounterWorkspaceAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booking_source: string;
  notes: string | null;
  service_name: string | null;
  service_duration: number | null;
  service_price: number | null;
  practitioner_name: string | null;
  branch_name: string | null;
}

export interface EncounterMedicalHistory {
  allergies: string[] | null;
  current_medications: string[] | null;
  chronic_conditions: string[] | null;
  past_surgeries: string | null;
  notes: string | null;
}

export interface PreviousEncounterSummary {
  id: string;
  appointment_id: string | null;
  started_at: string;
  completed_at: string | null;
  practitioner_name: string | null;
  service_booked: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  performed_treatment: string | null;
  patient_notes: string | null;
  follow_up_recommended: boolean;
  follow_up_date: string | null;
  follow_up_reason: string | null;
}

export interface EncounterOdontogramEntry {
  id: string;
  tooth_number: string;
  status: string;
  condition_code: string | null;
  condition_note: string | null;
  recommended_treatment: string | null;
  treatment_priority: string | null;
  planned_date: string | null;
  estimated_fee: number | null;
  recorded_at: string;
}

export interface EncounterOdontogramContext {
  current_entries: EncounterOdontogramEntry[];
  encounter_entries: EncounterOdontogramEntry[];
}

export interface EncounterPrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: string;
}

export interface EncounterPrescription {
  id: string;
  issued_at: string;
  notes: string | null;
  status: string;
  practitioner_name: string | null;
  encounter_id: string | null;
  appointment_id: string | null;
  items: EncounterPrescriptionItem[];
}

export interface EncounterFollowUpService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
}

export interface EncounterFollowUpSchedulingContext {
  practitioner_id: string;
  practitioner_name: string | null;
  branch_id: string;
  branch_name: string | null;
  services: EncounterFollowUpService[];
}

export interface EncounterWorkspaceContext {
  encounter: ClinicalEncounter;
  private_notes: string | null;
  patient: EncounterWorkspacePatient;
  appointment: EncounterWorkspaceAppointment | null;
  medical_history: EncounterMedicalHistory | null;
  previous_encounters: PreviousEncounterSummary[];
  odontogram: EncounterOdontogramContext;
  prescriptions: EncounterPrescription[];
  follow_up_appointments: EncounterWorkspaceAppointment[];
  follow_up_scheduling: EncounterFollowUpSchedulingContext | null;
  is_editable: boolean;
  mode: ConsultationMode;
}

export type EncounterWorkspaceLoaderError = "not_found" | "load_failed";

export type EncounterWorkspaceLoaderResult =
  | { data: EncounterWorkspaceContext; error: null; message?: never }
  | { data: null; error: EncounterWorkspaceLoaderError; message: string };

export interface SaveEncounterDraftResult {
  success: true;
  encounter_id: string;
  status: "in_progress";
  updated_at: string;
}

export type SaveEncounterDraftActionResult =
  | { data: SaveEncounterDraftResult; error: null }
  | { data: null; error: string };

export interface CompleteEncounterResult {
  success: true;
  encounter_id: string;
  appointment_id: string | null;
  status: "completed";
  completed_at: string;
}

export type CompleteEncounterActionResult =
  | { data: CompleteEncounterResult; error: null }
  | { data: null; error: string };





