import { useState } from "react";
import type {FormEvent} from "react";
import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Stethoscope, Sparkles, Shield, Zap } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useAuth } from "../../../auth/useAuth";
import type { UserRole } from "../../../auth/AuthContext";

function getDefaultPathForRole(role: UserRole | null) {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "hospital_admin":
      return "/hospital-admin/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "doctor_assistant":
      return "/assistant/dashboard";
    default:
      return "/app/dashboard";
  }
}

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation() as any;

  const isBusy = submitting || authLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // AuthContext.login does the API call, token storage, toast, and profile load
    const { role } = await login(email, password);

    if (role) {
      const from = location.state?.from;
      const target =
        from?.pathname && from.pathname !== "/login"
          ? from.pathname
          : getDefaultPathForRole(role);
      navigate(target, { replace: true });
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden m-6 rounded-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

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
                Welcome back to the future of healthcare
              </h2>
              <p className="text-xl text-blue-100">
                Sign in to access your AI-powered clinical consultation
                assistant.
              </p>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    AI-Powered Insights
                  </h3>
                  <p className="text-sm text-blue-100">
                    Real-time clinical documentation with intelligent
                    suggestions.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">HIPAA-Ready</h3>
                  <p className="text-sm text-blue-100">
                    Built with security and privacy controls for clinical
                    environments.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    Save Hours Every Day
                  </h3>
                  <p className="text-sm text-blue-100">
                    Reduce manual documentation time and focus on patient care.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
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
            <h2 className="text-4xl font-semibold tracking-tight">Sign In</h2>
            <p className="text-gray-500 text-lg">
              Continue to your personalized dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                required
                disabled={isBusy}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-2xl border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                required
                disabled={isBusy}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isBusy}
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {isBusy ? "Signing In..." : "Sign In to Dashboard"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                New to MedScribe?
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            disabled={isBusy}
            className="w-full h-14 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}