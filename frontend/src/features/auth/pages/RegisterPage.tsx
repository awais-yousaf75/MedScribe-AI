import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { Stethoscope, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { cn } from "../../../components/ui/utils";
import { DropStyle } from "../../../components/ui/drop-style";
import { API_URL } from "../../../auth/AuthContext";

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

const HOSPITAL_TYPES = ["Private", "Public", "Teaching"];

export function RegisterPage() {
  const navigate = useNavigate();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const res = await fetch(`${API_URL}/api/hospitals/approved`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load hospitals");
        }

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

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...payload } = formData;

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      toast.success("Account created successfully! Please sign in.");
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting;

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8 lg:p-12"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">MedScribe</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-semibold tracking-tight">
              Create Account
            </h2>
            <p className="text-gray-500 text-lg">
              Join thousands of clinicians using AI every day.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Dr. Sarah Johnson"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                required
                disabled={isBusy}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                required
                disabled={isBusy}
              />
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleChange("role", "doctor")}
                  className={cn(
                    "h-12 rounded-2xl border text-sm font-medium transition-all flex items-center justify-center",
                    formData.role === "doctor"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Doctor
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleChange("role", "admin")}
                  className={cn(
                    "h-12 rounded-2xl border text-sm font-medium transition-all flex items-center justify-center",
                    formData.role === "admin"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Hospital Admin
                </button>
              </div>
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                  required
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleChange("gender", g)}
                      className={cn(
                        "h-10 rounded-2xl border text-xs font-medium transition-all flex items-center justify-center",
                        formData.gender === g
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-sm font-medium">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                required
                disabled={isBusy}
              />
            </div>

            {/* Doctor-only fields */}
            {formData.role === "doctor" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    type="text"
                    placeholder="Cardiologist, General Physician, etc."
                    value={formData.specialization}
                    onChange={(e) =>
                      handleChange("specialization", e.target.value)
                    }
                    className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalId" className="text-sm font-medium">
                    Hospital (approved list)
                  </Label>
                  <DropStyle
                    id="hospitalId"
                    value={formData.hospitalId}
                    onChange={(e) =>
                      handleChange("hospitalId", e.target.value)
                    }
                    className="h-14 w-full rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600 px-4 bg-white"
                    required
                    disabled={isBusy || hospitalsLoading}
                  >
                    <option value="">
                      {hospitalsLoading
                        ? "Loading hospitals..."
                        : "Select hospital"}
                    </option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </DropStyle>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="licenseNumber"
                      className="text-sm font-medium"
                    >
                      License Number
                    </Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="Medical council registration"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        handleChange("licenseNumber", e.target.value)
                      }
                      className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                      required
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnic" className="text-sm font-medium">
                      CNIC
                    </Label>
                    <Input
                      id="cnic"
                      type="text"
                      placeholder="National ID"
                      value={formData.cnic}
                      onChange={(e) => handleChange("cnic", e.target.value)}
                      className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                      required
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Admin-only fields */}
            {formData.role === "admin" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hospitalName" className="text-sm font-medium">
                    Hospital Name
                  </Label>
                  <Input
                    id="hospitalName"
                    type="text"
                    placeholder="City Medical Hospital"
                    value={formData.hospitalName}
                    onChange={(e) =>
                      handleChange("hospitalName", e.target.value)
                    }
                    className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="hospitalAddress"
                    className="text-sm font-medium"
                  >
                    Hospital Address
                  </Label>
                  <Input
                    id="hospitalAddress"
                    type="text"
                    placeholder="Street, City, Country"
                    value={formData.hospitalAddress}
                    onChange={(e) =>
                      handleChange("hospitalAddress", e.target.value)
                    }
                    className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalType" className="text-sm font-medium">
                    Hospital Type
                  </Label>
                  <DropStyle
                    id="hospitalType"
                    value={formData.hospitalType}
                    onChange={(e) =>
                      handleChange("hospitalType", e.target.value)
                    }
                    className="h-14 w-full rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600 px-4 bg-white"
                    required
                    disabled={isBusy}
                  >
                    <option value="">Select type</option>
                    {HOSPITAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </DropStyle>
                </div>
              </>
            )}

            {/* Password + Confirm Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                  required
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                  required
                  disabled={isBusy}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isBusy}
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {isBusy ? "Creating Account..." : "Create Free Account"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            disabled={isBusy}
            className="w-full h-14 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <Link to="/login">Sign In Instead</Link>
          </Button>
        </div>
      </motion.div>

      {/* Right Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden m-6 rounded-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white w-full">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">MedScribe</h1>
          </div>

          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-5xl leading-tight font-semibold">
                Transform your clinical workflow today
              </h2>
              <p className="text-xl text-blue-100">
                Join thousands of doctors who save hours daily with AI-powered
                documentation.
              </p>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl mb-1 font-medium">
                    Free 14-day trial
                  </h3>
                  <p className="text-blue-100">
                    No credit card required to get started.
                  </p>
                </div>
              </motion.div>

              {/* you can add more marketing bullets here if you like */}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}