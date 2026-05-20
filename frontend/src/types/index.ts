// src/types/index.ts
// ─────────────────────────────────────────────────────────────
// Shared types used across the entire app
// ─────────────────────────────────────────────────────────────

export type UserRole =
  | "doctor"
  | "patient"
  | "doctor_assistant"
  | "hospital_admin"
  | "super_admin";

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar_url?: string | null;
  role: UserRole;
  approval_status: "pending" | "approved" | "rejected";
  [key: string]: any;
}

// ── Doctor types ──────────────────────────────────────────────

export type DoctorMeResponse = {
  user: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string; [key: string]: any };
  };
  profile: {
    id: string;
    full_name: string;
    phone?: string;
    gender?: string;
    dob?: string;
    avatar_url?: string | null;
    role: string;
    approval_status: "pending" | "approved" | "rejected";
  };
  doctor_profile: {
    profile_id: string;
    specialization: string;
    hospital_id: string;
    license_number: string;
    cnic: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected";
  } | null;
};

export type Assistant = {
  profile_id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  approval_status: "pending" | "approved" | "rejected";
};

export type Patient = {
  id: string;
  full_name: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  avatar_url?: string | null;
  cnic: string;
  created_at: string;
};

export type DayAvailability = {
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

export type AvailabilityRecord = {
  id: string;
  doctor_profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

// ── Assistant types ───────────────────────────────────────────

export type AssistantMeResponse = {
  user: { id: string; email: string };
  profile: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string | null;
    role: string;
    approval_status: "pending" | "approved" | "rejected";
  };
  assistant_link: {
    doctor_profile_id: string;
    hospital_id: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  doctor: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string | null;
  } | null;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: string;
  } | null;
};

export type AppointmentFromAPI = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  patient_profiles: {
    profile_id: string;
    cnic: string;
    profiles: {
      full_name: string;
      phone: string | null;
      gender: string | null;
      dob: string | null;
      avatar_url?: string | null;
    };
  };
  doctor_profiles: {
    profile_id: string;
    specialization: string;
    profiles: {
      full_name: string;
      avatar_url?: string | null;
    };
  };
  hospitals: { id: string; name: string };
};

export type ExistingPatientSearchResult = {
  found: boolean;
  patient?: {
    id: string;
    full_name: string;
    phone?: string | null;
    gender?: string | null;
    dob?: string | null;
    avatar_url?: string | null;
    cnic: string;
  };
  hospitals?: { id: string; name: string }[];
};