import { useState } from "react";
import { toast } from "sonner";
import ProductLogo from "../../components/common/ProductLogo";

interface LoginPageProps {
  onLogin: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LoginPage({ onLogin }: LoginPageProps) {
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
    <>

      <div className="auth-root">
        {/* Background layers */}
        <div className="auth-grain" />
        <div className="auth-vignette" />
        <div className="auth-line-left" />
        <div className="auth-line-right" />

        <div className="auth-shell">
          <div className="auth-card">
            <div className="auth-card-glow" />

            {/* Brand */}
            <div className="auth-top">
              <div className="auth-logo">
                <ProductLogo className="auth-logo-mark" />
              </div>
              <div>
                <div className="auth-brand-name">MedScribe AI</div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="auth-heading">Welcome back.</h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="password" className="auth-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="auth-spinner" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer" aria-hidden="true">
              <span className="auth-footer-line" />
              <div className="auth-footer-center">
                <span className="auth-footer-dot" />
                <span className="auth-footer-dot auth-footer-dot-large" />
                <span className="auth-footer-dot" />
              </div>
              <span className="auth-footer-line" />
            </div>
          </div>

          {/* Watermark below card */}
          <div className="auth-watermark">
            MedScribe AI — Clinical Intelligence
          </div>
        </div>
      </div>
    </>
  );
}
