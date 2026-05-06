import { useState } from "react";
import { Activity } from "lucide-react";
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --card: #F6F2EA;
          --card-top: #FBF8F2;
          --text: #10213D;
          --text-soft: #5E697A;
          --line: rgba(16, 33, 61, 0.10);
          --field: rgba(255, 255, 255, 0.72);
          --field-border: #D7DDE4;
          --field-focus: #1A7C6D;
          --accent: #1A7C6D;
          --gold: #B99657;
          --white: #FFFFFF;
        }

        * { box-sizing: border-box; }

        /* ─────────────────────────────────────────────
           BACKGROUND — The Premium Canvas
        ───────────────────────────────────────────── */
        .auth-root {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

          /* Deep layered base */
          background-color: #080D14;
          background-image:
            /* Top spotlight — warm, faint, centered */
            radial-gradient(
              ellipse 600px 350px at 50% -5%,
              rgba(185, 150, 87, 0.09) 0%,
              transparent 100%
            ),
            /* Center ambient — barely there cool glow behind card area */
            radial-gradient(
              ellipse 500px 500px at 50% 50%,
              rgba(26, 124, 109, 0.04) 0%,
              transparent 100%
            ),
            /* Bottom edge warmth */
            radial-gradient(
              ellipse 800px 250px at 50% 110%,
              rgba(185, 150, 87, 0.05) 0%,
              transparent 100%
            );
        }

        /* Film grain — analog texture */
        .auth-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.45;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
        }

        /* Vignette — darker edges, eye drawn to center */
        .auth-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse 70% 65% at 50% 48%,
            transparent 0%,
            rgba(0, 0, 0, 0.32) 100%
          );
        }

        /* Faint vertical line — architectural detail */
        .auth-line-left {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 15%;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 10%,
            rgba(185, 150, 87, 0.06) 40%,
            rgba(185, 150, 87, 0.06) 60%,
            transparent 90%
          );
          pointer-events: none;
        }

        .auth-line-right {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 15%;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 10%,
            rgba(185, 150, 87, 0.06) 40%,
            rgba(185, 150, 87, 0.06) 60%,
            transparent 90%
          );
          pointer-events: none;
        }

        /* ─────────────────────────────────────────────
           CARD
        ───────────────────────────────────────────── */
        .auth-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 520px;
        }

        .auth-card {
          position: relative;
          width: 100%;
          padding: 40px 40px 28px;
          border-radius: 24px;
          background:
            linear-gradient(180deg, var(--card-top) 0%, var(--card) 100%);
          border: 1px solid rgba(185, 150, 87, 0.18);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04),
            0 1px 2px rgba(0,0,0,0.06),
            0 6px 14px rgba(0,0,0,0.10),
            0 24px 48px rgba(0,0,0,0.18),
            0 48px 80px rgba(0,0,0,0.28);
        }

        /* Inner inset frame */
        .auth-card::before {
          content: "";
          position: absolute;
          inset: 12px;
          border-radius: 16px;
          border: 1px solid rgba(16, 33, 61, 0.07);
          pointer-events: none;
        }

        /* Gold hairline at top */
        .auth-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 32px;
          right: 32px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(185, 150, 87, 0.45) 20%,
            rgba(185, 150, 87, 0.45) 80%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Reflected light on card — top edge glow */
        .auth-card-glow {
          position: absolute;
          top: -1px;
          left: 60px;
          right: 60px;
          height: 60px;
          border-radius: 24px 24px 0 0;
          background: radial-gradient(
            ellipse at 50% 0%,
            rgba(185, 150, 87, 0.05) 0%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* ─────────────────────────────────────────────
           BRAND
        ───────────────────────────────────────────── */
        .auth-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 34px;
        }

        .auth-logo {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #10213D;
          border: 1px solid rgba(185, 150, 87, 0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          flex-shrink: 0;
        }

        .auth-brand-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        /* ─────────────────────────────────────────────
           HEADING
        ───────────────────────────────────────────── */
        .auth-heading {
          margin: 0 0 28px;
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 38px;
          line-height: 1.08;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.03em;
        }

        /* ─────────────────────────────────────────────
           FORM
        ───────────────────────────────────────────── */
        .auth-form { margin: 0; }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 24px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .auth-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .auth-input {
          width: 100%;
          height: 50px;
          padding: 0 15px;
          border-radius: 10px;
          border: 1px solid var(--field-border);
          background: var(--field);
          color: var(--text);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease;
        }

        .auth-input::placeholder { color: #99A4B2; }

        .auth-input:focus {
          border-color: var(--field-focus);
          box-shadow: 0 0 0 3px rgba(26, 124, 109, 0.11);
          background: var(--white);
        }

        .auth-input:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          background: #F0F2F4;
        }

        /* ─────────────────────────────────────────────
           SUBMIT
        ───────────────────────────────────────────── */
        .auth-submit {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(180deg, #1D7F70 0%, #145F54 100%);
          color: var(--white);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          font-family: 'Inter', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 12px 22px rgba(20, 95, 84, 0.20);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            filter 180ms ease;
          margin-bottom: 22px;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 16px 28px rgba(20, 95, 84, 0.24);
          filter: brightness(0.985);
        }

        .auth-submit:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          transform: none;
        }

        .auth-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.28);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: auth-spin 0.8s linear infinite;
        }

        @keyframes auth-spin { to { transform: rotate(360deg); } }

        /* ─────────────────────────────────────────────
           FOOTER
        ───────────────────────────────────────────── */
        .auth-footer {
          padding-top: 18px;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .auth-footer-item {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: #7B8593;
        }

        .auth-footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(185, 150, 87, 0.48);
          flex-shrink: 0;
        }

        /* ─────────────────────────────────────────────
           BOTTOM WATERMARK — below the card
        ───────────────────────────────────────────── */
        .auth-watermark {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.14);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          user-select: none;
        }

        /* ─────────────────────────────────────────────
           RESPONSIVE
        ───────────────────────────────────────────── */
        @media (max-width: 640px) {
          .auth-root { padding: 18px 14px; }

          .auth-shell { max-width: 100%; }

          .auth-card {
            padding: 28px 22px 22px;
            border-radius: 18px;
          }

          .auth-card::before {
            inset: 10px;
            border-radius: 12px;
          }

          .auth-heading { font-size: 30px; }

          .auth-footer {
            flex-direction: column;
            gap: 10px;
          }

          .auth-footer-dot { display: none; }

          .auth-line-left { left: 5%; }
          .auth-line-right { right: 5%; }

          .auth-watermark { font-size: 10px; margin-top: 22px; }
        }

        @media (max-width: 380px) {
          .auth-card { padding: 24px 18px 20px; }
          .auth-heading { font-size: 26px; }
          .auth-line-left,
          .auth-line-right { display: none; }
        }
      `}</style>

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
                <Activity size={18} color="#1A7C6D" />
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
