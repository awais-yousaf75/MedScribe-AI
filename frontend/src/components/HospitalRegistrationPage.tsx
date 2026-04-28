// pages/HospitalRegistrationPage.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, AlertCircle, CheckCircle2, Lock, Mail, User, Building2, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

interface RegistrationFormData {
  hospitalTypes: string[];
}

interface HospitalRegistrationPageProps {
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function HospitalRegistrationPage({ onBack }: HospitalRegistrationPageProps) {
  const [formData, setFormData] = useState({
    admin_email: "",
    admin_password: "",
    admin_password_confirm: "",
    admin_full_name: "",
    admin_phone: "",
    admin_gender: "male",
    admin_dob: "",
    hospital_name: "",
    hospital_type: "",
    hospital_address: "",
    hospital_registration_number: "",
    hospital_license_number: "",
    hospital_contact_email: "",
    hospital_contact_phone: "",
  });

  const [formOptions, setFormOptions] = useState<RegistrationFormData>({
    hospitalTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/superadmin/registration-form-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFormOptions(data);
      }
    } catch (err) {
      console.error("Failed to fetch form data:", err);
      toast.error("Failed to load form options");
    }
  };

  const validateStep = (step: number) => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      // Admin info validation
      if (!formData.admin_email) {
        stepErrors.admin_email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
        stepErrors.admin_email = "Invalid email format";
      }

      if (!formData.admin_password) {
        stepErrors.admin_password = "Password is required";
      } else if (formData.admin_password.length < 6) {
        stepErrors.admin_password = "Password must be at least 6 characters";
      }

      if (formData.admin_password !== formData.admin_password_confirm) {
        stepErrors.admin_password_confirm = "Passwords do not match";
      }

      if (!formData.admin_full_name) {
        stepErrors.admin_full_name = "Full name is required";
      }

      if (!formData.admin_phone) {
        stepErrors.admin_phone = "Phone number is required";
      }

      if (!formData.admin_dob) {
        stepErrors.admin_dob = "Date of birth is required";
      }
    }

    if (step === 2) {
      // Hospital info validation
      if (!formData.hospital_name) {
        stepErrors.hospital_name = "Hospital name is required";
      }

      if (!formData.hospital_type) {
        stepErrors.hospital_type = "Hospital type is required";
      }

      if (!formData.hospital_registration_number) {
        stepErrors.hospital_registration_number = "Registration number is required";
      } else if (!/^[A-Z0-9\-]{5,}$/.test(formData.hospital_registration_number)) {
        stepErrors.hospital_registration_number =
          'Must be 5+ chars with uppercase letters, numbers, and hyphens (e.g., "REG-12345")';
      }

      if (!formData.hospital_contact_email) {
        stepErrors.hospital_contact_email = "Contact email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.hospital_contact_email)) {
        stepErrors.hospital_contact_email = "Invalid email format";
      }

      if (!formData.hospital_contact_phone) {
        stepErrors.hospital_contact_phone = "Contact phone is required";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(2)) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`${API_URL}/api/superadmin/register-hospital-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || data.error || "Failed to register";
        throw new Error(errorMsg);
      }

      toast.success("Hospital admin and hospital registered successfully!");

      // Reset and go back
      setFormData({
        admin_email: "",
        admin_password: "",
        admin_password_confirm: "",
        admin_full_name: "",
        admin_phone: "",
        admin_gender: "male",
        admin_dob: "",
        hospital_name: "",
        hospital_type: "",
        hospital_address: "",
        hospital_registration_number: "",
        hospital_license_number: "",
        hospital_contact_email: "",
        hospital_contact_phone: "",
      });

      setErrors({});
      setCurrentStep(1);
      
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register hospital admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                Register Hospital & Admin
              </h1>
              <p className="text-white/90 text-xs sm:text-sm mt-1">
                Create a new hospital and assign an administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Progress Bar */}
        <div className="mb-8 sm:mb-10">
          <div className="flex gap-2 mb-4">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step <= currentStep
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {currentStep} of 2 - {currentStep === 1 ? "Admin Information" : "Hospital Details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Step 1: Admin Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column */}
                <div className="space-y-6 sm:space-y-7">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-purple-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold">
                        1
                      </span>
                      Admin Details
                    </h2>

                    <div className="space-y-4 sm:space-y-5">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="email"
                          placeholder="admin@hospital.com"
                          value={formData.admin_email}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_email: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_email ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_email && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_email}
                          </p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter full name"
                          value={formData.admin_full_name}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_full_name: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_full_name ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_full_name && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_full_name}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.admin_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_phone: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_phone ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_phone && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_phone}
                          </p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={formData.admin_gender}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_gender: e.target.value })
                          }
                          className="w-full h-11 sm:h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none bg-white text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="date"
                          value={formData.admin_dob}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_dob: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_dob ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_dob && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_dob}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 sm:space-y-7">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-blue-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                      Security Information
                    </h2>

                    <div className="space-y-4 sm:space-y-5">
                      {/* Password */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="password"
                          placeholder="Min 6 characters"
                          value={formData.admin_password}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_password: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_password ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_password && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_password}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Confirm Password <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={formData.admin_password_confirm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_password_confirm: e.target.value,
                            })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.admin_password_confirm ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.admin_password_confirm && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.admin_password_confirm}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mt-6">
                      <p className="text-sm text-blue-700 flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>
                          Ensure the password is secure with a mix of uppercase, lowercase, numbers, and symbols.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hospital Information */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column */}
                <div className="space-y-6 sm:space-y-7">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-green-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center font-bold">
                        2
                      </span>
                      Hospital Details
                    </h2>

                    <div className="space-y-4 sm:space-y-5">
                      {/* Hospital Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Hospital Name <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter hospital name"
                          value={formData.hospital_name}
                          onChange={(e) =>
                            setFormData({ ...formData, hospital_name: e.target.value })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.hospital_name ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.hospital_name && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.hospital_name}
                          </p>
                        )}
                      </div>

                      {/* Registration Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Registration Number <span className="text-red-500">*</span>
                          <span className="text-xs font-normal text-gray-500 block">
                            e.g., REG-12345 (must be unique)
                          </span>
                        </label>
                        <Input
                          type="text"
                          placeholder="REG-12345"
                          value={formData.hospital_registration_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_registration_number: e.target.value.toUpperCase(),
                            })
                          }
                          className={`h-11 sm:h-12 text-sm font-mono ${
                            errors.hospital_registration_number ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.hospital_registration_number && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-2">
                              {errors.hospital_registration_number}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Hospital Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Hospital Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.hospital_type}
                          onChange={(e) =>
                            setFormData({ ...formData, hospital_type: e.target.value })
                          }
                          className={`w-full h-11 sm:h-12 px-4 border-2 rounded-lg focus:border-green-400 focus:outline-none bg-white text-sm ${
                            errors.hospital_type ? "border-red-500" : "border-gray-200"
                          }`}
                        >
                          <option value="">Select hospital type</option>
                          {formOptions.hospitalTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        {errors.hospital_type && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.hospital_type}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Hospital Address
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter full hospital address"
                          value={formData.hospital_address}
                          onChange={(e) =>
                            setFormData({ ...formData, hospital_address: e.target.value })
                          }
                          className="h-11 sm:h-12 text-sm"
                        />
                      </div>

                      {/* License Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          License Number
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter license number (optional)"
                          value={formData.hospital_license_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_license_number: e.target.value,
                            })
                          }
                          className="h-11 sm:h-12 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 sm:space-y-7">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-orange-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                      Contact Information
                    </h2>

                    <div className="space-y-4 sm:space-y-5">
                      {/* Contact Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Contact Email <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="email"
                          placeholder="contact@hospital.com"
                          value={formData.hospital_contact_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_contact_email: e.target.value,
                            })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.hospital_contact_email ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.hospital_contact_email && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.hospital_contact_email}
                          </p>
                        )}
                      </div>

                      {/* Contact Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact Phone <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.hospital_contact_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_contact_phone: e.target.value,
                            })
                          }
                          className={`h-11 sm:h-12 text-sm ${
                            errors.hospital_contact_phone ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {errors.hospital_contact_phone && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {errors.hospital_contact_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mt-6">
                      <p className="text-sm text-orange-700 flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>
                          These contact details will be used for hospital-related communications.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Bottom Actions */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between sticky bottom-0 bg-white py-4 px-4 sm:px-0 rounded-xl shadow-lg sm:shadow-none sm:bg-transparent">
          {currentStep === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={loading}
              className="rounded-xl h-11 sm:h-12 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Step
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="rounded-xl h-11 sm:h-12 text-sm flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="rounded-xl h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg text-white border-0 disabled:opacity-50 text-sm flex-1"
            >
              Next Step
              <Plus className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl h-11 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white border-0 disabled:opacity-50 text-sm flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </span>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default HospitalRegistrationPage;