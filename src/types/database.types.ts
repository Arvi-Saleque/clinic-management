export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          booking_source: string
          branch_id: string
          cancellation_reason: string | null
          created_at: string
          created_by_profile_id: string | null
          deposit_id: string | null
          ends_at: string
          id: string
          notes: string | null
          organization_id: string
          originating_encounter_id: string | null
          patient_id: string
          practitioner_id: string
          service_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_source: string
          branch_id: string
          cancellation_reason?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          deposit_id?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          organization_id: string
          originating_encounter_id?: string | null
          patient_id: string
          practitioner_id: string
          service_id: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_source?: string
          branch_id?: string
          cancellation_reason?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          deposit_id?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          originating_encounter_id?: string | null
          patient_id?: string
          practitioner_id?: string
          service_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "booking_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_originating_encounter_fk"
            columns: [
              "originating_encounter_id",
              "patient_id",
              "practitioner_id",
              "organization_id",
            ]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: [
              "id",
              "patient_id",
              "practitioner_id",
              "organization_id",
            ]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          date: string
          end_time: string | null
          id: string
          is_unavailable: boolean
          practitioner_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          date: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean
          practitioner_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          date?: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean
          practitioner_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          branch_id: string
          day_of_week: number
          effective_from: string
          effective_to: string | null
          end_time: string
          id: string
          practitioner_id: string
          start_time: string
        }
        Insert: {
          branch_id: string
          day_of_week: number
          effective_from?: string
          effective_to?: string | null
          end_time: string
          id?: string
          practitioner_id: string
          start_time: string
        }
        Update: {
          branch_id?: string
          day_of_week?: number
          effective_from?: string
          effective_to?: string | null
          end_time?: string
          id?: string
          practitioner_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_deposits: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          currency: string
          id: string
          payment_reference: string | null
          status: string
        }
        Insert: {
          amount?: number
          appointment_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_deposits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          phone: string | null
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          phone?: string | null
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_attachments: {
        Row: {
          category: string
          created_at: string
          encounter_id: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: string
          is_patient_visible: boolean
          notes: string | null
          organization_id: string
          patient_id: string
          storage_path: string
          uploaded_by_profile_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          encounter_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          is_patient_visible?: boolean
          notes?: string | null
          organization_id: string
          patient_id: string
          storage_path: string
          uploaded_by_profile_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          encounter_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_patient_visible?: boolean
          notes?: string | null
          organization_id?: string
          patient_id?: string
          storage_path?: string
          uploaded_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_attachments_encounter_fk"
            columns: ["encounter_id", "patient_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "patient_id", "organization_id"]
          },
          {
            foreignKeyName: "clinical_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_attachments_patient_org_fk"
            columns: ["patient_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "clinical_attachments_uploaded_by_profile_id_fkey"
            columns: ["uploaded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_encounter_private_notes: {
        Row: {
          clinical_notes: string
          created_at: string
          encounter_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          clinical_notes: string
          created_at?: string
          encounter_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          clinical_notes?: string
          created_at?: string
          encounter_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_private_notes_encounter_fk"
            columns: ["encounter_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      clinical_encounters: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          completed_at: string | null
          created_at: string
          diagnosis: string | null
          follow_up_date: string | null
          follow_up_reason: string | null
          follow_up_recommended: boolean
          id: string
          organization_id: string
          patient_id: string
          patient_notes: string | null
          performed_treatment: string | null
          practitioner_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          follow_up_reason?: string | null
          follow_up_recommended?: boolean
          id?: string
          organization_id: string
          patient_id: string
          patient_notes?: string | null
          performed_treatment?: string | null
          practitioner_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          follow_up_reason?: string | null
          follow_up_recommended?: boolean
          id?: string
          organization_id?: string
          patient_id?: string
          patient_notes?: string | null
          performed_treatment?: string | null
          practitioner_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_encounters_appointment_fk"
            columns: [
              "appointment_id",
              "patient_id",
              "practitioner_id",
              "organization_id",
            ]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: [
              "id",
              "patient_id",
              "practitioner_id",
              "organization_id",
            ]
          },
          {
            foreignKeyName: "clinical_encounters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_encounters_patient_org_fk"
            columns: ["patient_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "clinical_encounters_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      family_links: {
        Row: {
          created_at: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_patient_id: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          is_primary_contact: boolean
          patient_id: string
        }
        Insert: {
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_patient_id?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          is_primary_contact?: boolean
          patient_id: string
        }
        Update: {
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_patient_id?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          is_primary_contact?: boolean
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_guardian_patient_id_fkey"
            columns: ["guardian_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          service_id: string | null
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          service_id?: string | null
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          service_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by_staff_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          patient_id: string
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_history: {
        Row: {
          allergies: string[]
          chronic_conditions: string[]
          created_at: string
          current_medications: string[]
          id: string
          is_current: boolean
          notes: string | null
          past_surgeries: string | null
          patient_id: string
          recorded_by_staff_id: string | null
          source: string
          version: number
        }
        Insert: {
          allergies?: string[]
          chronic_conditions?: string[]
          created_at?: string
          current_medications?: string[]
          id?: string
          is_current?: boolean
          notes?: string | null
          past_surgeries?: string | null
          patient_id: string
          recorded_by_staff_id?: string | null
          source: string
          version: number
        }
        Update: {
          allergies?: string[]
          chronic_conditions?: string[]
          created_at?: string
          current_medications?: string[]
          id?: string
          is_current?: boolean
          notes?: string | null
          past_surgeries?: string | null
          patient_id?: string
          recorded_by_staff_id?: string | null
          source?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_history_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          appointment_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          organization_id: string
          patient_id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          appointment_id?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id: string
          patient_id: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          type: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          patient_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_entries: {
        Row: {
          appointment_id: string | null
          chart_type: string
          condition_code: string | null
          condition_note: string | null
          encounter_id: string | null
          estimated_fee: number | null
          id: string
          is_current: boolean
          patient_id: string
          planned_date: string | null
          recommended_treatment: string | null
          recorded_at: string
          recorded_by_practitioner_id: string
          status: string
          surface: string | null
          tooth_number: string
          treatment_priority: string | null
        }
        Insert: {
          appointment_id?: string | null
          chart_type?: string
          condition_code?: string | null
          condition_note?: string | null
          encounter_id?: string | null
          estimated_fee?: number | null
          id?: string
          is_current?: boolean
          patient_id: string
          planned_date?: string | null
          recommended_treatment?: string | null
          recorded_at?: string
          recorded_by_practitioner_id: string
          status: string
          surface?: string | null
          tooth_number: string
          treatment_priority?: string | null
        }
        Update: {
          appointment_id?: string | null
          chart_type?: string
          condition_code?: string | null
          condition_note?: string | null
          encounter_id?: string | null
          estimated_fee?: number | null
          id?: string
          is_current?: boolean
          patient_id?: string
          planned_date?: string | null
          recommended_treatment?: string | null
          recorded_at?: string
          recorded_by_practitioner_id?: string
          status?: string
          surface?: string | null
          tooth_number?: string
          treatment_priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_entries_encounter_patient_fk"
            columns: ["encounter_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "patient_id"]
          },
          {
            foreignKeyName: "odontogram_entries_encounter_visit_fk"
            columns: ["encounter_id", "appointment_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "appointment_id", "patient_id"]
          },
          {
            foreignKeyName: "odontogram_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_entries_recorded_by_practitioner_id_fkey"
            columns: ["recorded_by_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          branch_id: string
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
        }
        Insert: {
          branch_id: string
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
        }
        Update: {
          branch_id?: string
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_tier: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_tier?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_tier?: string
          slug?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          created_at: string
          created_by_staff_id: string | null
          dob: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          paid_at: string
          recorded_by_staff_id: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          paid_at?: string
          recorded_by_staff_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          recorded_by_staff_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_services: {
        Row: {
          override_duration_minutes: number | null
          override_price: number | null
          practitioner_id: string
          service_id: string
        }
        Insert: {
          override_duration_minutes?: number | null
          override_price?: number | null
          practitioner_id: string
          service_id: string
        }
        Update: {
          override_duration_minutes?: number | null
          override_price?: number | null
          practitioner_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_services_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          bio: string | null
          branch_id: string
          created_at: string
          id: string
          is_bookable: boolean
          photo_url: string | null
          profile_id: string
          specialties: string[]
          title: string | null
        }
        Insert: {
          bio?: string | null
          branch_id: string
          created_at?: string
          id?: string
          is_bookable?: boolean
          photo_url?: string | null
          profile_id: string
          specialties?: string[]
          title?: string | null
        }
        Update: {
          bio?: string | null
          branch_id?: string
          created_at?: string
          id?: string
          is_bookable?: boolean
          photo_url?: string | null
          profile_id?: string
          specialties?: string[]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioners_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medicine_name: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medicine_name: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medicine_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          encounter_id: string | null
          id: string
          issued_at: string
          notes: string | null
          patient_id: string
          practitioner_id: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          patient_id: string
          practitioner_id: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          patient_id?: string
          practitioner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_encounter_patient_fk"
            columns: ["encounter_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "patient_id"]
          },
          {
            foreignKeyName: "prescriptions_encounter_visit_fk"
            columns: ["encounter_id", "appointment_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "clinical_encounters"
            referencedColumns: ["id", "appointment_id", "patient_id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_submissions: {
        Row: {
          form_version: number
          id: string
          patient_id: string
          raw_payload: Json
          reviewed_at: string | null
          reviewed_by_staff_id: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          form_version?: number
          id?: string
          patient_id: string
          raw_payload: Json
          reviewed_at?: string | null
          reviewed_by_staff_id?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          form_version?: number
          id?: string
          patient_id?: string
          raw_payload?: Json
          reviewed_at?: string | null
          reviewed_by_staff_id?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_submissions_reviewed_by_staff_id_fkey"
            columns: ["reviewed_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          branch_id: string | null
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price: number
          show_on_website: boolean
          slug: string
        }
        Insert: {
          branch_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price?: number
          show_on_website?: boolean
          slug: string
        }
        Update: {
          branch_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price?: number
          show_on_website?: boolean
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment: {
        Args: {
          p_booking_source: string
          p_branch_id: string
          p_notes?: string
          p_originating_encounter_id?: string
          p_patient_id: string
          p_practitioner_id: string
          p_service_id: string
          p_starts_at: string
        }
        Returns: string
      }
      cancel_appointment: {
        Args: { p_appointment_id: string; p_reason?: string }
        Returns: undefined
      }
      chart_patient_tooth: {
        Args: {
          p_condition_code: string
          p_condition_note: string
          p_encounter_id: string
          p_estimated_fee: number
          p_patient_id: string
          p_planned_date: string
          p_recommended_treatment: string
          p_status: string
          p_tooth_number: string
          p_treatment_priority: string
        }
        Returns: Json
      }
      complete_clinical_encounter: {
        Args: {
          p_chief_complaint?: string | null
          p_diagnosis: string
          p_encounter_id: string
          p_follow_up_date?: string | null
          p_follow_up_reason?: string | null
          p_follow_up_recommended: boolean
          p_patient_notes?: string | null
          p_performed_treatment: string
          p_private_notes?: string | null
        }
        Returns: Json
      }
      create_clinical_prescription: {
        Args: {
          p_encounter_id: string
          p_items: Json
          p_notes: string
          p_patient_id: string
        }
        Returns: Json
      }
      get_available_slots: {
        Args: {
          p_date: string
          p_practitioner_id: string
          p_service_id: string
        }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      queue_appointment_reminders: { Args: never; Returns: undefined }
      reschedule_appointment: {
        Args: { p_appointment_id: string; p_new_starts_at: string }
        Returns: undefined
      }
      reset_date_availability_override: {
        Args: { p_date: string; p_practitioner_id: string }
        Returns: undefined
      }
      save_clinical_encounter_draft: {
        Args: {
          p_chief_complaint?: string | null
          p_diagnosis?: string | null
          p_encounter_id: string
          p_follow_up_date?: string | null
          p_follow_up_reason?: string | null
          p_follow_up_recommended?: boolean | null
          p_patient_notes?: string | null
          p_performed_treatment?: string | null
          p_private_notes?: string | null
        }
        Returns: Json
      }
      save_date_availability_override: {
        Args: {
          p_date: string
          p_intervals?: Json
          p_is_unavailable: boolean
          p_practitioner_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      save_weekly_availability: {
        Args: { p_branch_id: string; p_practitioner_id: string; p_rules: Json }
        Returns: undefined
      }
      start_or_resume_clinical_encounter: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
