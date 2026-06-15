import { useState } from "react";
import { Activity, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to login");
      if (data.session?.access_token)
        localStorage.setItem("accessToken", data.session.access_token);
      if (data.user?.user_metadata?.role)
        localStorage.setItem("role", data.user.user_metadata.role);
      toast.success("Signed in successfully!");
      onLogin();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px 60px;
          font-family: 'Inter', system-ui, sans-serif;
          background-color: #EDF7F4;
          position: relative;
          overflow: hidden;
        }

        /* ── decorative blobs ── */
        .lp-blob-tr {
          position: absolute;
          top: -60px; right: -80px;
          width: 360px; height: 360px;
          border-radius: 50% 44% 56% 40% / 46% 52% 48% 54%;
          background: linear-gradient(140deg, #34D399 0%, #1A7C6D 100%);
          opacity: 0.85;
          pointer-events: none;
        }
        .lp-blob-bl {
          position: absolute;
          bottom: 20px; left: -55px;
          width: 160px; height: 160px;
          border-radius: 64% 36% 50% 50% / 48% 42% 58% 52%;
          background: linear-gradient(140deg, #6EE7B7 0%, #0EC8A0 100%);
          opacity: 0.75;
          pointer-events: none;
        }

        /* ── logo row ── */
        .lp-logo {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .lp-logo-icon {
          width: 46px; height: 46px;
          border-radius: 13px;
          background: linear-gradient(135deg, #1A7C6D 0%, #0EC8A0 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(26,124,109,0.30);
        }
        .lp-logo-name {
          font-size: 24px;
          font-weight: 800;
          color: #10213D;
          letter-spacing: -0.03em;
        }

        /* ── heading ── */
        .lp-heading {
          position: relative;
          z-index: 2;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800;
          color: #10213D;
          letter-spacing: -0.03em;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.15;
        }

        /* ── card ── */
        .lp-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 18px;
          padding: 36px 36px 28px;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.04),
            0 8px 24px rgba(16,33,61,0.08),
            0 24px 48px rgba(16,33,61,0.06);
        }

        @media (max-width: 480px) {
          .lp-card { padding: 28px 20px 22px; }
        }

        /* ── field ── */
        .lp-field { margin-bottom: 18px; }

        .lp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #4B5563;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .lp-inp-wrap { position: relative; }

        .lp-inp-icon {
          position: absolute;
          left: 16px; top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          display: flex; align-items: center;
          pointer-events: none;
          transition: color 150ms;
        }
        .lp-inp-wrap:focus-within .lp-inp-icon { color: #1A7C6D; }

        .lp-inp {
          width: 100%;
          height: 54px;
          padding: 0 16px 0 46px;
          border: 1.5px solid #D1D5DB;
          border-radius: 10px;
          background: #fff;
          color: #10213D;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
          -webkit-appearance: none;
        }
        .lp-inp::placeholder { color: #BBC0C9; }
        .lp-inp:focus {
          border-color: #1A7C6D;
          box-shadow: 0 0 0 3px rgba(26,124,109,0.10);
        }
        .lp-inp.has-eye { padding-right: 46px; }
        .lp-inp:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-eye-btn {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          padding: 5px; cursor: pointer;
          color: #9CA3AF;
          display: flex; align-items: center;
          border-radius: 6px;
          transition: color 130ms, background 130ms;
          line-height: 0;
        }
        .lp-eye-btn:hover { color: #4B5563; background: #F3F4F6; }

        /* ── sign in button ── */
        .lp-btn {
          width: 100%;
          height: 54px;
          margin-top: 6px;
          border: none;
          border-radius: 100px;
          background: linear-gradient(135deg, #1D8F7E 0%, #1A7C6D 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          letter-spacing: -0.01em;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(26,124,109,0.30);
          transition: transform 130ms, box-shadow 130ms, filter 130ms;
          margin-bottom: 20px;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,124,109,0.38);
          filter: brightness(1.05);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lp-spin {
          width: 16px; height: 16px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lpspin 0.7s linear infinite;
        }
        @keyframes lpspin { to { transform: rotate(360deg); } }

        /* ── footer note ── */
        .lp-card-footer {
          text-align: center;
          font-size: 12.5px;
          color: #9CA3AF;
          line-height: 1.6;
          padding-top: 16px;
          border-top: 1px solid #F3F4F6;
        }
        .lp-card-footer strong { color: #6B7280; font-weight: 500; }

      `}</style>

      <div className="lp-root">

        {/* blobs */}
        <div className="lp-blob-tr" />
        <div className="lp-blob-bl" />

        {/* logo */}
        <div className="lp-logo">
          <div className="lp-logo-icon">
            <Activity size={22} color="#fff" />
          </div>
          <span className="lp-logo-name">MedScribe AI</span>
        </div>

        {/* heading */}
        <h1 className="lp-heading">Good to see you again</h1>

        {/* card */}
        <div className="lp-card">
          <form onSubmit={handleSubmit}>

            {/* email */}
            <div className="lp-field">
              <label htmlFor="lp-email" className="lp-label">Your email</label>
              <div className="lp-inp-wrap">
                <span className="lp-inp-icon"><Mail size={16} /></span>
                <input
                  id="lp-email"
                  type="email"
                  placeholder="e.g. doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="lp-inp"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* password */}
            <div className="lp-field">
              <label htmlFor="lp-pass" className="lp-label">Your password</label>
              <div className="lp-inp-wrap">
                <span className="lp-inp-icon"><Lock size={16} /></span>
                <input
                  id="lp-pass"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="lp-inp has-eye"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* submit */}
            <button type="submit" className="lp-btn" disabled={loading}>
              {loading
                ? <><span className="lp-spin" /> Signing in…</>
                : "Sign in"
              }
            </button>

          </form>

          <p className="lp-card-footer">
            Access is limited to authorized personnel.<br />
            <strong>Contact your administrator</strong> to request access.
          </p>
        </div>


      </div>
    </>
  );
}
