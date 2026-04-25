import { useState, useEffect } from "react";
import {
  Activity,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  Sparkles,
  Stethoscope,
  Calendar,
  CreditCard,
  FileText,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface RegisterPageProps {
  onRegister: () => void;
  onNavigateToLogin: () => void;
}

type Role = "doctor" | "admin";
type Gender = "male" | "female" | "other";

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: Gender;
  dob: string;
  role: Role;

  specialization: string;
  hospitalId: string;
  licenseNumber: string;
  cnic: string;

  hospitalName: string;
  hospitalAddress: string;
  hospitalType: string;
};

type Hospital = {
  id: string;
  name: string;
  address?: string;
  hospital_type?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const HOSPITAL_TYPES = ["Private", "Public", "Teaching"];

type HospitalNameCheck = {
  checking: boolean;
  exists: boolean;
  status: "pending" | "approved" | "rejected" | null;
  message: string | null;
  existingHospitalName?: string | null;
};

export function RegisterPage({ onRegister, onNavigateToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState<RegisterForm>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "male",
    dob: "",
    role: "doctor",
    specialization: "",
    hospitalId: "",
    licenseNumber: "",
    cnic: "",
    hospitalName: "",
    hospitalAddress: "",
    hospitalType: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [hospitalNameCheck, setHospitalNameCheck] = useState<HospitalNameCheck>({
    checking: false,
    exists: false,
    status: null,
    message: null,
    existingHospitalName: null,
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const res = await fetch(`${API_URL}/api/hospitals/approved`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
        setHospitals(data.hospitals as Hospital[]);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to load hospitals");
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  // live hospital name check for admin role
  useEffect(() => {
    if (formData.role !== "admin") {
      setHospitalNameCheck({
        checking: false,
        exists: false,
        status: null,
        message: null,
        existingHospitalName: null,
      });
      return;
    }

    const name = formData.hospitalName.trim();
    if (name.length < 3) {
      setHospitalNameCheck({
        checking: false,
        exists: false,
        status: null,
        message: null,
        existingHospitalName: null,
      });
      return;
    }

    const t = setTimeout(async () => {
      try {
        setHospitalNameCheck((p) => ({ ...p, checking: true }));
        const res = await fetch(
          `${API_URL}/api/hospitals/check-name?name=${encodeURIComponent(name)}`
        );
        const data = await res.json();

        if (!res.ok) {
          // don’t block user if check endpoint fails
          setHospitalNameCheck({
            checking: false,
            exists: false,
            status: null,
            message: null,
            existingHospitalName: null,
          });
          return;
        }

        setHospitalNameCheck({
          checking: false,
          exists: !!data.exists,
          status: data.status ?? null,
          message: data.message ?? null,
          existingHospitalName: data.existingHospital?.name ?? null,
        });
      } catch {
        setHospitalNameCheck({
          checking: false,
          exists: false,
          status: null,
          message: null,
          existingHospitalName: null,
        });
      }
    }, 450);

    return () => clearTimeout(t);
  }, [formData.role, formData.hospitalName]);

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    !isLoading &&
    agreedToTerms &&
    (formData.role !== "admin" || (!hospitalNameCheck.exists && !hospitalNameCheck.checking));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.role === "admin" && hospitalNameCheck.exists) {
      toast.error("This hospital is already registered. Please use a different name.");
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...payload } = formData;

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Prefer message from backend (your updated auth route includes `code`)
        if (data.code === "HOSPITAL_NAME_TAKEN") {
          setHospitalNameCheck({
            checking: false,
            exists: true,
            status: data.status ?? null,
            message: data.error ?? "Hospital already exists",
            existingHospitalName: data.existingHospital?.name ?? null,
          });
          toast.error(data.error || "Hospital already exists");
          return;
        }

        throw new Error(data.error || "Failed to register");
      }

      toast.success("Account created successfully! Pending approval.");
      onRegister();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const StyledSelect = ({
    id,
    value,
    onChange,
    children,
    disabled,
    icon: Icon,
    bgGradient,
    required = true,
  }: {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
    disabled?: boolean;
    icon: React.ElementType;
    bgGradient: string;
    required?: boolean;
  }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-12 pl-10 pr-10 rounded-xl border-2 shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ background: bgGradient }}
        required={required}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}
            >
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                MedScribe AI
              </h1>
              <p className="text-sm text-gray-500">Clinical Intelligence Platform</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900">
              Create your MedScribe AI Account
            </h2>
            <p className="text-gray-500">
              Join thousands of healthcare professionals using AI-powered clinical assistance
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleChange("role", "doctor")}
                  className={cn(
                    "h-12 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                    formData.role === "doctor"
                      ? "text-white border-transparent shadow-lg"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                  style={
                    formData.role === "doctor"
                      ? { background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }
                      : undefined
                  }
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleChange("role", "admin")}
                  className={cn(
                    "h-12 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                    formData.role === "admin"
                      ? "text-white border-transparent shadow-lg"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                  style={
                    formData.role === "admin"
                      ? { background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }
                      : undefined
                  }
                >
                  <Building2 className="w-4 h-4" />
                  Hospital Admin
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Sarah Johnson"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="pl-10 h-12 border-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #ffffff 0%, #eff6ff 100%)" }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-10 h-12 border-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #ffffff 0%, #faf5ff 100%)" }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-10 h-12 border-2 shadow-sm"
                    style={{ background: "linear-gradient(90deg, #ffffff 0%, #f0fdfa 100%)" }}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleChange("gender", g)}
                      className={cn(
                        "h-12 rounded-xl border-2 text-xs font-medium transition-all capitalize",
                        formData.gender === g
                          ? "text-white border-transparent shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      )}
                      style={
                        formData.gender === g
                          ? { background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }
                          : undefined
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="pl-10 h-12 border-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #ffffff 0%, #fef3c7 100%)" }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Doctor fields */}
            {formData.role === "doctor" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="specialization"
                      type="text"
                      placeholder="Cardiologist, General Physician, etc."
                      value={formData.specialization}
                      onChange={(e) => handleChange("specialization", e.target.value)}
                      className="pl-10 h-12 border-2 shadow-sm"
                      style={{ background: "linear-gradient(90deg, #ffffff 0%, #fce7f3 100%)" }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalId">Hospital (from approved list)</Label>
                  <StyledSelect
                    id="hospitalId"
                    value={formData.hospitalId}
                    onChange={(e) => handleChange("hospitalId", e.target.value)}
                    disabled={isLoading || hospitalsLoading}
                    icon={Building2}
                    bgGradient="linear-gradient(90deg, #ffffff 0%, #f0fdf4 100%)"
                  >
                    <option value="">
                      {hospitalsLoading ? "Loading hospitals..." : "Select hospital"}
                    </option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </StyledSelect>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="Medical license #"
                        value={formData.licenseNumber}
                        onChange={(e) => handleChange("licenseNumber", e.target.value)}
                        className="pl-10 h-12 border-2 shadow-sm"
                        style={{ background: "linear-gradient(90deg, #ffffff 0%, #e0e7ff 100%)" }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC / National ID</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="cnic"
                        type="text"
                        placeholder="National ID number"
                        value={formData.cnic}
                        onChange={(e) => handleChange("cnic", e.target.value)}
                        className="pl-10 h-12 border-2 shadow-sm"
                        style={{ background: "linear-gradient(90deg, #ffffff 0%, #fef9c3 100%)" }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Admin fields */}
            {formData.role === "admin" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="hospitalName"
                      type="text"
                      placeholder="City Medical Center"
                      value={formData.hospitalName}
                      onChange={(e) => handleChange("hospitalName", e.target.value)}
                      className={cn(
                        "pl-10 pr-10 h-12 border-2 shadow-sm",
                        hospitalNameCheck.exists ? "border-red-300" : ""
                      )}
                      style={{
                        background: hospitalNameCheck.exists
                          ? "linear-gradient(90deg, #ffffff 0%, #fef2f2 100%)"
                          : "linear-gradient(90deg, #ffffff 0%, #f0fdf4 100%)",
                      }}
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {hospitalNameCheck.checking ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : hospitalNameCheck.exists ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : formData.hospitalName.trim().length >= 3 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>

                  {hospitalNameCheck.message && (
                    <div
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-xl border text-sm",
                        hospitalNameCheck.exists
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      )}
                    >
                      {hospitalNameCheck.exists ? (
                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{hospitalNameCheck.message}</p>
                        {hospitalNameCheck.exists && (
                          <p className="text-xs mt-1 opacity-90">
                            This is to prevent duplicate hospitals in the system. If you believe this is wrong, contact support.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalAddress">Hospital Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="hospitalAddress"
                      type="text"
                      placeholder="123 Medical Drive, City, Country"
                      value={formData.hospitalAddress}
                      onChange={(e) => handleChange("hospitalAddress", e.target.value)}
                      className="pl-10 h-12 border-2 shadow-sm"
                      style={{ background: "linear-gradient(90deg, #ffffff 0%, #fce7f3 100%)" }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalType">Hospital Type</Label>
                  <StyledSelect
                    id="hospitalType"
                    value={formData.hospitalType}
                    onChange={(e) => handleChange("hospitalType", e.target.value)}
                    disabled={isLoading}
                    icon={Users}
                    bgGradient="linear-gradient(90deg, #ffffff 0%, #e0e7ff 100%)"
                  >
                    <option value="">Select type</option>
                    {HOSPITAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </StyledSelect>
                </div>
              </>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10 h-12 border-2 shadow-sm"
                    style={{ background: "linear-gradient(90deg, #ffffff 0%, #fef3c7 100%)" }}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="pl-10 h-12 border-2 shadow-sm"
                    style={{ background: "linear-gradient(90deg, #ffffff 0%, #fee2e2 100%)" }}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{
                background: "linear-gradient(90deg, #eff6ff 0%, #f0fdfa 100%)",
                borderColor: "#93c5fd",
              }}
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-700">
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </a>
                , and understand that MedScribe AI is HIPAA compliant and designed for clinical use.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-14 text-lg text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                disabled={isLoading}
                className="font-medium hover:underline"
                style={{ color: "#2563EB" }}
              >
                Sign in to MedScribe AI
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #14B8A6 0%, #6366F1 50%, #2563EB 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 text-white space-y-8 max-w-md">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)" }}
          >
            <Activity className="w-12 h-12" />
          </div>

          <h3 className="text-5xl font-semibold leading-tight">
            Join the Future of Clinical Documentation
          </h3>

          <p className="text-xl leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            MedScribe AI streamlines your workflow with intelligent transcription, automated diagnosis
            suggestions, and instant prescription generation.
          </p>

          <div className="space-y-4 pt-4">
            {[
              "Real-time consultation transcription",
              "AI-powered diagnosis assistance",
              "Automated prescription generation",
              "Secure HIPAA-compliant storage",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(12px)" }}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-lg" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  {feature}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <div
              className="rounded-2xl p-5 flex-1 shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p className="text-3xl font-bold mb-1">50K+</p>
              <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Healthcare Providers
              </p>
            </div>
            <div
              className="rounded-2xl p-5 flex-1 shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p className="text-3xl font-bold mb-1">99.9%</p>
              <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Uptime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}