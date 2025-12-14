import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Stethoscope, Sparkles, Shield, Zap } from "lucide-react";
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

      // Optional: store access token and role from user_metadata
      if (data.session?.access_token) {
        localStorage.setItem("accessToken", data.session.access_token);
      }
      if (data.user?.user_metadata?.role) {
        localStorage.setItem("role", data.user.user_metadata.role);
      }

      toast.success("Signed in successfully!");
      onLogin(); // App.tsx will handle navigation/auth state
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding Content (unchanged) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden m-6 rounded-3xl"
      >
        {/* ...keep your existing left-side branding exactly as is... */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white w-full">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl">MedScribe</h1>
          </div>

          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-5xl leading-tight">
                Welcome back to the future of healthcare
              </h2>
              <p className="text-xl text-blue-100">
                Sign in to access your AI-powered clinical consultation
                assistant
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
                  <h3 className="text-lg mb-1">AI-Powered Insights</h3>
                  <p className="text-sm text-blue-100">
                    Real-time clinical documentation with intelligent
                    suggestions
                  </p>
                </div>
              </motion.div>

              {/* ...rest of your feature blocks... */}
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
            <h1 className="text-2xl">MedScribe</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl">Sign In</h2>
            <p className="text-gray-500 text-lg">Continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
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
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">
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
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {isLoading ? "Signing In..." : "Sign In to Dashboard"}
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
            onClick={onNavigateToRegister}
            variant="outline"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Create Free Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
