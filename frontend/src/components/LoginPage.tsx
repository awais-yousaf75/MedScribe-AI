import { useState } from "react";
import { Activity, Lock, Mail, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LoginPage({ onLogin, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to login");
      }

      // Store access token and role from user_metadata
      if (data.session?.access_token) {
        localStorage.setItem("accessToken", data.session.access_token);
      }
      if (data.user?.user_metadata?.role) {
        localStorage.setItem("role", data.user.user_metadata.role);
      }

      toast.success("Signed in successfully!");
      onLogin();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
              }}
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

          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-gray-900">Sign in to MedScribe AI</h2>
            <p className="text-gray-500">
              Access your AI-powered clinical consultation assistant
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-14 border-2 shadow-sm"
                  style={{
                    background: "linear-gradient(90deg, #ffffff 0%, #eff6ff 100%)",
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-14 border-2 shadow-sm"
                  style={{
                    background: "linear-gradient(90deg, #ffffff 0%, #faf5ff 100%)",
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium hover:underline"
                style={{ color: "#2563EB" }}
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg text-white shadow-md hover:shadow-lg transition-all"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToRegister}
                disabled={isLoading}
                className="font-medium hover:underline"
                style={{ color: "#2563EB" }}
              >
                Create a MedScribe AI Account
              </button>
            </div>
          </form>

          {/* Trust Badges */}
          <div className="pt-6 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-4 font-medium">
              Trusted by healthcare professionals worldwide
            </p>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{
                  background: "linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%)",
                  borderColor: "#bbf7d0",
                }}
              >
                <Lock className="w-4 h-4" style={{ color: "#16a34a" }} />
                <span className="font-medium" style={{ color: "#15803d" }}>
                  HIPAA Compliant
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{
                  background: "linear-gradient(90deg, #faf5ff 0%, #fdf2f8 100%)",
                  borderColor: "#e9d5ff",
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#9333ea" }} />
                <span className="font-medium" style={{ color: "#7e22ce" }}>
                  AI-Powered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #14B8A6 100%)",
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 text-white space-y-8 max-w-md">
          {/* Icon */}
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Activity className="w-12 h-12" />
          </div>

          {/* Heading */}
          <h3 className="text-5xl font-semibold leading-tight">
            Transform Clinical Consultations with AI
          </h3>

          {/* Description */}
          <p className="text-xl leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            MedScribe AI captures, transcribes, and analyzes medical conversations in real-time,
            helping doctors save time and improve patient care.
          </p>

          {/* Stats Cards */}
          <div className="flex gap-4 pt-4">
            <div
              className="rounded-2xl p-6 flex-1 shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p className="text-4xl font-bold mb-2">10K+</p>
              <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Consultations
              </p>
            </div>
            <div
              className="rounded-2xl p-6 flex-1 shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p className="text-4xl font-bold mb-2">95%</p>
              <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Accuracy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}