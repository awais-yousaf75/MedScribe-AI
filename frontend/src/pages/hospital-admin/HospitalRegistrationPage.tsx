import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  Shield,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface RegistrationFormData {
  hospitalTypes: string[];
}

interface HospitalRegistrationPageProps {}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function HospitalRegistrationPage({}: HospitalRegistrationPageProps) {
  const navigate = useNavigate();
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
      const res = await fetch(
        `${API_URL}/api/superadmin/registration-form-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      if (!formData.admin_email) {
        stepErrors.admin_email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
        stepErrors.admin_email = "Invalid email format";
      }

      if (!formData.admin_password) {
        stepErrors.admin_password = "Password is required";
      } else if (formData.admin_password.length < 8) {
        stepErrors.admin_password = "Password must be at least 8 characters";
      }

      if (formData.admin_password !== formData.admin_password_confirm) {
        stepErrors.admin_password_confirm = "Passwords do not match";
      }

      if (!formData.admin_full_name) {
        stepErrors.admin_full_name = "Full name is required";
      } else if (!/^[a-zA-Z\s.\-']+$/.test(formData.admin_full_name.trim())) {
        stepErrors.admin_full_name = "Full name must contain only letters, spaces, hyphens, or apostrophes";
      }

      if (!formData.admin_phone) {
        stepErrors.admin_phone = "Phone number is required";
      } else if (!/^[\+]?[\d\s\-\(\)]{7,15}$/.test(formData.admin_phone.trim())) {
        stepErrors.admin_phone = "Invalid phone number format";
      }

      if (!formData.admin_dob) {
        stepErrors.admin_dob = "Date of birth is required";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(formData.admin_dob) >= today) {
          stepErrors.admin_dob = "Date of birth cannot be today or in the future";
        }
      }
    }

    if (step === 2) {
      if (!formData.hospital_name) {
        stepErrors.hospital_name = "Hospital name is required";
      }

      if (!formData.hospital_type) {
        stepErrors.hospital_type = "Hospital type is required";
      }

      if (!formData.hospital_registration_number) {
        stepErrors.hospital_registration_number =
          "Registration number is required";
      } else if (
        !/^[A-Z0-9\-]{5,}$/.test(formData.hospital_registration_number)
      ) {
        stepErrors.hospital_registration_number =
          'Must be 5+ chars with uppercase letters, numbers, and hyphens (e.g., "REG-12345")';
      }

      if (!formData.hospital_contact_email) {
        stepErrors.hospital_contact_email = "Contact email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.hospital_contact_email)
      ) {
        stepErrors.hospital_contact_email = "Invalid email format";
      }

      if (!formData.hospital_contact_phone) {
        stepErrors.hospital_contact_phone = "Contact phone is required";
      } else if (!/^[\+]?[\d\s\-\(\)]{7,15}$/.test(formData.hospital_contact_phone.trim())) {
        stepErrors.hospital_contact_phone = "Invalid phone number format";
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
      const res = await fetch(
        `${API_URL}/api/superadmin/register-hospital-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || data.error || "Failed to register";
        throw new Error(errorMsg);
      }

      toast.success("Hospital admin and hospital registered successfully!");

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
        navigate(-1);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register hospital admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-root">
      {/* Header */}
      <div className="hr-header">
        <div className="hr-header-inner">
          <div className="hr-header-content">
            <button
              onClick={() => navigate(-1)}
              className="hr-back-btn"
              title="Go back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="hr-header-text">
              <h1 className="hr-title">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                Register Hospital & Admin
              </h1>
              <p className="hr-subtitle">
                Create a new hospital and assign an administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="hr-main">
        {/* Progress Bar */}
        <div className="hr-progress-wrap">
          <div className="hr-progress-bars">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`hr-progress-bar ${
                  step <= currentStep ? "hr-progress-bar-active" : ""
                }`}
              />
            ))}
          </div>
          <p className="hr-progress-label">
            Step {currentStep} of 2 —{" "}
            {currentStep === 1 ? "Admin Information" : "Hospital Details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="hr-form">
          {/* Step 1: Admin Information */}
          {currentStep === 1 && (
            <div className="hr-step">
              <div className="hr-grid">
                {/* Left Column — Admin Details */}
                <div className="hr-column">
                  <div className="hr-section hr-section-admin">
                    <div className="hr-section-header">
                      <span className="hr-step-number hr-step-number-1">1</span>
                      <h2 className="hr-section-title">Admin Details</h2>
                    </div>

                    <div className="hr-fields">
                      {/* Email */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Mail className="hr-label-icon" />
                          Email Address <span className="hr-required">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="admin@hospital.com"
                          value={formData.admin_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_email: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.admin_email ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.admin_email && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_email}
                          </p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <User className="hr-label-icon" />
                          Full Name <span className="hr-required">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter full name"
                          value={formData.admin_full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_full_name: e.target.value.replace(/[^a-zA-Z\s.\-']/g, ""),
                            })
                          }
                          className={`hr-input ${
                            errors.admin_full_name ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.admin_full_name && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_full_name}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Phone className="hr-label-icon" />
                          Phone Number <span className="hr-required">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.admin_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_phone: e.target.value.replace(/[^0-9+\s()\-]/g, ""),
                            })
                          }
                          className={`hr-input ${
                            errors.admin_phone ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.admin_phone && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_phone}
                          </p>
                        )}
                      </div>

                      {/* Gender */}
                      <div className="hr-field-group">
                        <label className="hr-label">Gender</label>
                        <select
                          value={formData.admin_gender}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_gender: e.target.value,
                            })
                          }
                          className="hr-select"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          Date of Birth <span className="hr-required">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.admin_dob}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_dob: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.admin_dob ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.admin_dob && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_dob}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column — Security */}
                <div className="hr-column">
                  <div className="hr-section hr-section-security">
                    <div className="hr-section-header">
                      <span className="hr-step-number hr-step-number-1">
                        <Shield className="w-5 h-5" />
                      </span>
                      <h2 className="hr-section-title">Security Information</h2>
                    </div>

                    <div className="hr-fields">
                      {/* Password */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Lock className="hr-label-icon" />
                          Password <span className="hr-required">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Min 8 characters"
                          value={formData.admin_password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_password: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.admin_password ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.admin_password && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_password}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Lock className="hr-label-icon" />
                          Confirm Password{" "}
                          <span className="hr-required">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Confirm password"
                          value={formData.admin_password_confirm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              admin_password_confirm: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.admin_password_confirm
                              ? "hr-input-error"
                              : ""
                          }`}
                        />
                        {errors.admin_password_confirm && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.admin_password_confirm}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="hr-info-box hr-info-box-blue">
                      <CheckCircle2 className="hr-info-icon" />
                      <p className="hr-info-text">
                        Ensure the password is secure with a mix of uppercase,
                        lowercase, numbers, and symbols.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hospital Information */}
          {currentStep === 2 && (
            <div className="hr-step">
              <div className="hr-grid">
                {/* Left Column — Hospital Details */}
                <div className="hr-column">
                  <div className="hr-section hr-section-hospital">
                    <div className="hr-section-header">
                      <span className="hr-step-number hr-step-number-2">2</span>
                      <h2 className="hr-section-title">Hospital Details</h2>
                    </div>

                    <div className="hr-fields">
                      {/* Hospital Name */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Building2 className="hr-label-icon" />
                          Hospital Name <span className="hr-required">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter hospital name"
                          value={formData.hospital_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_name: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.hospital_name ? "hr-input-error" : ""
                          }`}
                        />
                        {errors.hospital_name && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.hospital_name}
                          </p>
                        )}
                      </div>

                      {/* Registration Number */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          Registration Number{" "}
                          <span className="hr-required">*</span>
                          <span className="hr-helper">
                            e.g., REG-12345 (must be unique)
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="REG-12345"
                          value={formData.hospital_registration_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_registration_number:
                                e.target.value.replace(/[^A-Za-z0-9\-]/g, "").toUpperCase(),
                            })
                          }
                          className={`hr-input hr-mono ${
                            errors.hospital_registration_number
                              ? "hr-input-error"
                              : ""
                          }`}
                        />
                        {errors.hospital_registration_number && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            <span>
                              {errors.hospital_registration_number}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Hospital Type */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          Hospital Type <span className="hr-required">*</span>
                        </label>
                        <select
                          value={formData.hospital_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_type: e.target.value,
                            })
                          }
                          className={`hr-select ${
                            errors.hospital_type ? "hr-select-error" : ""
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
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.hospital_type}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <MapPin className="hr-label-icon" />
                          Hospital Address
                        </label>
                        <input
                          type="text"
                          placeholder="Enter full hospital address"
                          value={formData.hospital_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_address: e.target.value,
                            })
                          }
                          className="hr-input"
                        />
                      </div>

                      {/* License Number */}
                      <div className="hr-field-group">
                        <label className="hr-label">License Number</label>
                        <input
                          type="text"
                          placeholder="Enter license number (optional)"
                          value={formData.hospital_license_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_license_number: e.target.value,
                            })
                          }
                          className="hr-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column — Contact Information */}
                <div className="hr-column">
                  <div className="hr-section hr-section-contact">
                    <div className="hr-section-header">
                      <span className="hr-step-number hr-step-number-2">
                        <Phone className="w-5 h-5" />
                      </span>
                      <h2 className="hr-section-title">Contact Information</h2>
                    </div>

                    <div className="hr-fields">
                      {/* Contact Email */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Mail className="hr-label-icon" />
                          Contact Email <span className="hr-required">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="contact@hospital.com"
                          value={formData.hospital_contact_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_contact_email: e.target.value,
                            })
                          }
                          className={`hr-input ${
                            errors.hospital_contact_email
                              ? "hr-input-error"
                              : ""
                          }`}
                        />
                        {errors.hospital_contact_email && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.hospital_contact_email}
                          </p>
                        )}
                      </div>

                      {/* Contact Phone */}
                      <div className="hr-field-group">
                        <label className="hr-label">
                          <Phone className="hr-label-icon" />
                          Contact Phone <span className="hr-required">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.hospital_contact_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hospital_contact_phone: e.target.value.replace(/[^0-9+\s()\-]/g, ""),
                            })
                          }
                          className={`hr-input ${
                            errors.hospital_contact_phone
                              ? "hr-input-error"
                              : ""
                          }`}
                        />
                        {errors.hospital_contact_phone && (
                          <p className="hr-error">
                            <AlertCircle className="hr-error-icon" />
                            {errors.hospital_contact_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="hr-info-box hr-info-box-orange">
                      <CheckCircle2 className="hr-info-icon" />
                      <p className="hr-info-text">
                        These contact details will be used for hospital-related
                        communications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Bottom Actions */}
        <div className="hr-actions">
          <div className="hr-actions-left">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={loading}
                className="hr-btn hr-btn-outline"
              >
                <ArrowLeft className="hr-btn-icon" />
                Previous Step
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="hr-btn hr-btn-outline hr-btn-full"
            >
              Cancel
            </button>
          </div>
          <div className="hr-actions-right">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="hr-btn hr-btn-primary hr-btn-full"
              >
                Next Step
                <Plus className="hr-btn-icon" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="hr-btn hr-btn-success hr-btn-full"
              >
                {loading ? (
                  <>
                    <span className="hr-spinner" />
                    Registering...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <CheckCircle2 className="hr-btn-icon" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalRegistrationPage;