import { Router, Request, Response } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────
// GET /appointments/hospitals
// Get all approved hospitals (for patient)
// ─────────────────────────────────────────────
router.get(
  "/hospitals",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { data: hospitals, error } = await supabase
        .from("hospitals")
        .select(
          `
          id,
          name,
          address,
          hospital_type,
          contact_email,
          contact_phone
        `
        )
        .eq("status", "approved")
        .order("name", { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch hospitals: " + error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Hospitals fetched successfully",
        data: hospitals,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// GET /appointments/hospitals/:hospitalId/doctors
// Get doctors who have approved assistants (for patient)
// ─────────────────────────────────────────────
router.get(
  "/hospitals/:hospitalId/doctors",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { hospitalId } = req.params;

      // ── Step 1: Get all approved doctors of this hospital ──
      const { data: doctors, error: doctorsError } = await supabase
        .from("doctor_profiles")
        .select(
          `
          profile_id,
          specialization,
          license_number,
          profiles!inner (
            id,
            full_name,
            phone,
            gender
          )
        `
        )
        .eq("hospital_id", hospitalId)
        .eq("approval_status", "approved");

      if (doctorsError) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch doctors: " + doctorsError.message,
        });
      }

      if (!doctors || doctors.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No doctors found for this hospital",
          data: [],
        });
      }

      // ── Step 2: Get doctor IDs that have approved assistants ──
      const doctorIds = doctors.map((d) => d.profile_id);

      const { data: assistants, error: assistantsError } = await supabase
        .from("doctor_assistant_profiles")
        .select("doctor_profile_id")
        .in("doctor_profile_id", doctorIds)
        .eq("hospital_id", hospitalId)
        .eq("approval_status", "approved");

      if (assistantsError) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch assistants: " + assistantsError.message,
        });
      }

      // ── Step 3: Filter doctors who have at least one approved assistant ──
      const doctorsWithAssistants = new Set(
        assistants?.map((a) => a.doctor_profile_id) || []
      );

      const availableDoctors = doctors.filter((doctor) =>
        doctorsWithAssistants.has(doctor.profile_id)
      );

      if (availableDoctors.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No available doctors at the moment",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: "Available doctors fetched successfully",
        data: availableDoctors,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// POST /appointments/book
// Patient books an appointment
// ─────────────────────────────────────────────
router.post("/book", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { doctor_profile_id, hospital_id, appointment_date, appointment_time, notes } =
      req.body;

    // ── Validate required fields ──
    if (!doctor_profile_id || !hospital_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message:
          "doctor_profile_id, hospital_id, appointment_date and appointment_time are required",
      });
    }

    // ── Verify user is a patient ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can book appointments",
      });
    }

    // ── Verify patient profile exists ──
    const { data: patientProfile, error: patientError } = await supabase
      .from("patient_profiles")
      .select("profile_id")
      .eq("profile_id", userId)
      .single();

    if (patientError || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    // ── Verify doctor exists and is approved ──
    const { data: doctor, error: doctorError } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", doctor_profile_id)
      .eq("hospital_id", hospital_id)
      .eq("approval_status", "approved")
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or not approved",
      });
    }

    // ── Find the approved assistant for this doctor ──
    const { data: assistant, error: assistantError } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id")
      .eq("doctor_profile_id", doctor_profile_id)
      .eq("hospital_id", hospital_id)
      .eq("approval_status", "approved")
      .single();

    if (assistantError || !assistant) {
      return res.status(400).json({
        success: false,
        message:
          "This doctor has no assigned assistant. Booking is not available.",
      });
    }

    // ── Check if patient already has a pending/approved appointment 
    //    with same doctor on same date ──
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_profile_id", userId)
      .eq("doctor_profile_id", doctor_profile_id)
      .eq("appointment_date", appointment_date)
      .in("status", ["pending", "approved"])
      .single();

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending or approved appointment with this doctor on this date",
      });
    }

    // ── Create appointment assigned to assistant ──
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_profile_id: userId,
        doctor_profile_id,
        hospital_id,
        appointment_date,
        appointment_time,
        notes: notes || null,
        status: "pending",
        assigned_to: assistant.profile_id,
      })
      .select()
      .single();

    if (appointmentError) {
      return res.status(500).json({
        success: false,
        message: "Failed to book appointment: " + appointmentError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully. Waiting for assistant approval.",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET /appointments/my
// Patient views their own appointments
// ─────────────────────────────────────────────
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // ── Verify patient ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // ── Fetch all appointments of patient ──
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        created_at,
        updated_at,
        doctor_profiles!inner (
          profile_id,
          specialization,
          profiles!inner (
            full_name,
            phone
          )
        ),
        hospitals!inner (
          id,
          name,
          address
        )
      `
      )
      .eq("patient_profile_id", userId)
      .order("appointment_date", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointments: " + error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// ─────────────────────────────────────────────
// PATCH /appointments/:id/cancel
// Patient cancels their appointment
// ─────────────────────────────────────────────
router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      // ── Fetch the appointment ──
      const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .eq("patient_profile_id", userId)
        .single();

      if (fetchError || !appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // ── Only pending or approved appointments can be cancelled ──
      if (!["pending", "approved"].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel an appointment that is ${appointment.status}`,
        });
      }

      // ── Update status to cancelled ──
      const { data: updated, error: updateError } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: "Failed to cancel appointment: " + updateError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// GET /appointments/assistant/pending
// Assistant views pending appointments assigned to them
// ─────────────────────────────────────────────
router.get(
  "/assistant/pending",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      // ── Verify assistant role ──
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile || profile.role !== "doctor_assistant") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Assistants only.",
        });
      }

      // ── Fetch pending appointments assigned to this assistant ──
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          created_at,
          patient_profiles!inner (
            profile_id,
            cnic,
            profiles!inner (
              full_name,
              phone,
              gender,
              dob
            )
          ),
          doctor_profiles!inner (
            profile_id,
            specialization,
            profiles!inner (
              full_name
            )
          ),
          hospitals!inner (
            id,
            name
          )
        `
        )
        .eq("assigned_to", userId)
        .eq("status", "pending")
        .order("appointment_date", { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch appointments: " + error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pending appointments fetched successfully",
        data: appointments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// PATCH /appointments/:id/handle
// Assistant approves or rejects an appointment
// ─────────────────────────────────────────────
router.patch(
  "/:id/handle",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { action } = req.body; // action: 'approved' | 'rejected'

      // ── Validate action ──
      if (!action || !["approved", "rejected"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "action must be either 'approved' or 'rejected'",
        });
      }

      // ── Verify assistant role ──
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile || profile.role !== "doctor_assistant") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Assistants only.",
        });
      }

      // ── Fetch the appointment ──
      const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .eq("assigned_to", userId)
        .single();

      if (fetchError || !appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found or not assigned to you",
        });
      }

      // ── Only pending appointments can be handled ──
      if (appointment.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Appointment is already ${appointment.status}`,
        });
      }

      // ── Update appointment status ──
      const { data: updated, error: updateError } = await supabase
        .from("appointments")
        .update({
          status: action,
          handled_by: userId,
          handled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: "Failed to update appointment: " + updateError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Appointment ${action} successfully`,
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// GET /appointments/doctor/approved
// Doctor views their approved appointments
// ─────────────────────────────────────────────
router.get(
  "/doctor/approved",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      // ── Verify doctor role ──
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile || profile.role !== "doctor") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Doctors only.",
        });
      }

      // ── Fetch approved appointments for this doctor ──
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          created_at,
          patient_profiles!inner (
            profile_id,
            cnic,
            medical_history,
            profiles!inner (
              full_name,
              phone,
              gender,
              dob
            )
          ),
          hospitals!inner (
            id,
            name
          )
        `
        )
        .eq("doctor_profile_id", userId)
        .eq("status", "approved")
        .order("appointment_date", { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch appointments: " + error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Approved appointments fetched successfully",
        data: appointments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /appointments/doctors/:doctorId/slots?date=YYYY-MM-DD
// Returns available time slots for a doctor on a specific date
// Blocks already pending/approved slots
// ─────────────────────────────────────────────────────────────
router.get(
  "/doctors/:doctorId/slots",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query as { date?: string };

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "date query parameter is required (YYYY-MM-DD)",
        });
      }

      // Validate date format
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      // Get day of week: JS getDay() → 0=Sun...6=Sat
      // Our schema:       0=Mon...6=Sun
      // Convert:
      const jsDay = parsedDate.getDay(); // 0=Sun
      const dbDay = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon...6=Sun

      // Fetch doctor's availability for this day
      const { data: availability, error: availError } = await supabase
        .from("doctor_availability")
        .select("start_time, end_time, slot_duration_minutes")
        .eq("doctor_profile_id", doctorId)
        .eq("day_of_week", dbDay)
        .single();

      if (availError || !availability) {
        return res.status(200).json({
          success: true,
          message: "Doctor is not available on this day",
          data: {
            available: false,
            slots: [],
          },
        });
      }

      // Generate all time slots
      const allSlots = generateTimeSlots(
        availability.start_time,
        availability.end_time,
        availability.slot_duration_minutes
      );

      // Fetch already booked slots (pending or approved) for this doctor on this date
      const { data: bookedAppointments, error: bookedError } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("doctor_profile_id", doctorId)
        .eq("appointment_date", date)
        .in("status", ["pending", "approved"]);

      if (bookedError) {
        console.error("Fetch booked slots error:", bookedError);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch booked slots",
        });
      }

      // Normalize booked times to HH:MM for comparison
      const bookedTimes = new Set(
        (bookedAppointments || []).map((a) =>
          a.appointment_time.substring(0, 5) // "HH:MM:SS" → "HH:MM"
        )
      );

      // Mark each slot as available or booked
      const slots = allSlots.map((time) => ({
        time,
        available: !bookedTimes.has(time),
      }));

      return res.status(200).json({
        success: true,
        message: "Slots fetched successfully",
        data: {
          available: true,
          date,
          day_of_week: dbDay,
          slots,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /appointments/assistant/all
// Assistant views ALL appointments (all statuses)
// ─────────────────────────────────────────────────────────────
router.get(
  "/assistant/all",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      // Verify assistant role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile || profile.role !== "doctor_assistant") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Assistants only.",
        });
      }

      // Fetch ALL appointments assigned to this assistant
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          created_at,
          updated_at,
          handled_at,
          patient_profiles!inner (
            profile_id,
            cnic,
            profiles!inner (
              full_name,
              phone,
              gender,
              dob
            )
          ),
          doctor_profiles!inner (
            profile_id,
            specialization,
            profiles!inner (
              full_name
            )
          ),
          hospitals!inner (
            id,
            name
          )
        `
        )
        .eq("assigned_to", userId)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch appointments: " + error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Appointments fetched successfully",
        data: appointments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// HELPER — Generate time slots between start and end
// ─────────────────────────────────────────────────────────────
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM]     = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes   = endH   * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
    currentMinutes += durationMinutes;
  }

  return slots;
}

export default router;