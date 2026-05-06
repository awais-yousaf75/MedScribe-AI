import React from "react";
import {
  Building2,
  RefreshCw,
  Stethoscope,
  UserCog,
  Users,
  ArrowRight,
  AlertTriangle,
  Link2,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function OverviewPage({
  dashboard,
  loading,
  onRefresh,
  onNavigate,
}: {
  dashboard: any;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (
    page: "overview" | "doctors" | "assistants" | "hospital-profile"
  ) => void;
}) {
  const stats = dashboard?.stats || {
    doctorsActive:      0,
    doctorsInactive:    0,
    assistantsActive:   0,
    assistantsInactive: 0,
    patientsCount:      0,
    assistantsUnlinked: 0,
  };

  const hospital = dashboard?.hospital;

  // ── Stat card config ─────────────────────────────────────────
  const statCards = [
    {
      label:       "Active Doctors",
      value:       stats.doctorsActive,
      sub:         `${stats.doctorsInactive} inactive`,
      icon:        Stethoscope,
      grad:        "from-blue-500 to-cyan-500",
      iconBg:      "bg-blue-50",
      iconColor:   "text-blue-600",
      border:      "border-blue-100",
      btnGrad:     "from-blue-500 to-cyan-500",
      btnLabel:    "Manage Doctors",
      page:        "doctors" as const,
      activeColor: "text-blue-600",
    },
    {
      label:       "Active Assistants",
      value:       stats.assistantsActive,
      sub:         `${stats.assistantsInactive} inactive`,
      icon:        UserCog,
      grad:        "from-violet-500 to-purple-500",
      iconBg:      "bg-violet-50",
      iconColor:   "text-violet-600",
      border:      "border-violet-100",
      btnGrad:     "from-violet-500 to-purple-500",
      btnLabel:    "Manage Assistants",
      page:        "assistants" as const,
      activeColor: "text-violet-600",
    },
    {
      label:       "Total Patients",
      value:       stats.patientsCount,
      sub:         "Count only — data is private",
      icon:        Users,
      grad:        "from-emerald-500 to-teal-500",
      iconBg:      "bg-emerald-50",
      iconColor:   "text-emerald-600",
      border:      "border-emerald-100",
      btnGrad:     null,
      btnLabel:    null,
      page:        null,
      activeColor: "text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div
        className="px-8 py-8 shadow-sm"
        style={{
          background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-6">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#14b8a6,#06b6d4)",
                  }}
                >
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Overview
                </h1>
              </div>
              <p className="text-slate-400 text-sm ml-12">
                {hospital
                  ? `Managing · ${hospital.name}`
                  : "No hospital assigned"}
              </p>
            </div>

            {/* Right — Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-medium text-slate-300 transition-all hover:text-white
                hover:bg-white/10 disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Hospital status strip */}
          {hospital && (
            <div
              className="mt-6 flex items-center gap-4 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)",
                       border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Building2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {hospital.name}
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold
                  px-3 py-1 rounded-full flex-shrink-0 ${
                    hospital.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : hospital.status === "pending"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hospital.status === "approved" ? "bg-emerald-400" :
                  hospital.status === "pending"  ? "bg-amber-400"   :
                                                   "bg-rose-400"
                }`} />
                {hospital.status?.charAt(0).toUpperCase() +
                  hospital.status?.slice(1)}
              </span>

              <button
                onClick={() => onNavigate("hospital-profile")}
                className="flex items-center gap-1.5 text-xs font-medium
                  text-teal-400 hover:text-teal-300 transition-colors
                  flex-shrink-0 ml-2"
              >
                View Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Stat Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`bg-white rounded-2xl border ${card.border}
                  shadow-sm overflow-hidden`}
              >
                {/* Top accent bar */}
                <div
                  className={`h-1 w-full bg-gradient-to-r ${card.grad}`}
                />
                <div className="p-6">
                  {/* Icon + value */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center
                        justify-center ${card.iconBg}`}
                    >
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-4xl font-black tracking-tight
                          ${card.activeColor}`}
                      >
                        {loading ? (
                          <span className="text-gray-200 animate-pulse">—</span>
                        ) : (
                          card.value
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Label */}
                  <p className="text-gray-900 font-bold text-sm">
                    {card.label}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{card.sub}</p>

                  {/* Button */}
                  {card.btnLabel && card.page ? (
                    <button
                      onClick={() => onNavigate(card.page!)}
                      className={`mt-4 w-full flex items-center justify-center
                        gap-2 py-2.5 rounded-xl text-white text-xs font-semibold
                        bg-gradient-to-r ${card.btnGrad} shadow-sm
                        hover:opacity-90 transition-opacity`}
                    >
                      {card.btnLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div
                      className="mt-4 px-4 py-2.5 rounded-xl text-center
                        text-xs font-medium text-emerald-700 bg-emerald-50"
                    >
                      Patient data is private
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick Health ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Doctors health */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">
                  Doctor Health
                </p>
                <p className="text-gray-400 text-xs">
                  Active vs inactive breakdown
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: stats.doctorsActive + stats.doctorsInactive > 0
                          ? `${Math.round(
                              (stats.doctorsActive /
                                (stats.doctorsActive + stats.doctorsInactive)) *
                                100
                            )}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">
                    {stats.doctorsActive}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-gray-700 font-medium">
                    Inactive
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all"
                      style={{
                        width: stats.doctorsActive + stats.doctorsInactive > 0
                          ? `${Math.round(
                              (stats.doctorsInactive /
                                (stats.doctorsActive + stats.doctorsInactive)) *
                                100
                            )}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">
                    {stats.doctorsInactive}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("doctors")}
              className="mt-5 w-full flex items-center justify-center gap-2
                py-2.5 rounded-xl text-xs font-semibold text-blue-600
                bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Go to Doctors
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Assistants health */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">
                  Assistant Health
                </p>
                <p className="text-gray-400 text-xs">
                  Active vs inactive breakdown
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width:
                          stats.assistantsActive + stats.assistantsInactive > 0
                            ? `${Math.round(
                                (stats.assistantsActive /
                                  (stats.assistantsActive +
                                    stats.assistantsInactive)) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">
                    {stats.assistantsActive}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-gray-700 font-medium">
                    Inactive
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all"
                      style={{
                        width:
                          stats.assistantsActive + stats.assistantsInactive > 0
                            ? `${Math.round(
                                (stats.assistantsInactive /
                                  (stats.assistantsActive +
                                    stats.assistantsInactive)) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">
                    {stats.assistantsInactive}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("assistants")}
              className="mt-5 w-full flex items-center justify-center gap-2
                py-2.5 rounded-xl text-xs font-semibold text-violet-600
                bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              Go to Assistants
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Alert Panel ───────────────────────────────────── */}
        {stats.assistantsUnlinked > 0 && (
          <div
            className="bg-white rounded-2xl border border-amber-200 shadow-sm
              overflow-hidden"
          >
            {/* Top bar */}
            <div
              className="px-6 py-4 flex items-center justify-between gap-4"
              style={{
                background:
                  "linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)",
                borderBottom: "1px solid #fde68a",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm">
                    Action Required
                  </p>
                  <p className="text-amber-700 text-xs font-medium">
                    {stats.assistantsUnlinked} assistant
                    {stats.assistantsUnlinked !== 1 ? "s" : ""} not linked to
                    a doctor
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("assistants")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl
                  text-xs font-semibold text-white
                  bg-gradient-to-r from-amber-500 to-orange-500
                  hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
              >
                <Link2 className="w-3.5 h-3.5" />
                Link Now
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className="rounded-xl p-5"
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                }}
              >
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">
                  Unlinked Assistants
                </p>
                <p className="text-5xl font-black text-gray-900">
                  {stats.assistantsUnlinked}
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  Cannot be routed to consultations until linked to a doctor
                </p>
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  How to fix
                </p>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    Open the <strong>Assistants</strong> page
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    Click <strong>Link</strong> on each unlinked assistant
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    Select the correct doctor and save
                  </li>
                </ol>
                <button
                  onClick={() => onNavigate("assistants")}
                  className="mt-4 flex items-center gap-2 text-xs font-semibold
                    text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Go to Assistants
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Hospital quick card ───────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm
            p-6 flex flex-col md:flex-row md:items-center gap-5"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center
              flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#14b8a6,#06b6d4)",
            }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
              Your Hospital
            </p>
            <p className="text-gray-900 font-bold text-lg truncate">
              {hospital?.name || "Not assigned"}
            </p>
            {hospital?.status && (
              <p className="text-gray-500 text-sm mt-0.5 capitalize">
                Status:{" "}
                <span
                  className={
                    hospital.status === "approved"
                      ? "text-emerald-600 font-semibold"
                      : "text-amber-600 font-semibold"
                  }
                >
                  {hospital.status}
                </span>
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate("hospital-profile")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-semibold text-white flex-shrink-0
              bg-gradient-to-r from-teal-500 to-cyan-500
              hover:opacity-90 transition-opacity shadow-sm"
          >
            View Profile
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Summary row ───────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg,#0f172a,#1e293b)",
          }}
        >
          <TrendingUp className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm">
            <span className="text-white font-bold">
              {stats.doctorsActive} doctors
            </span>{" "}
            and{" "}
            <span className="text-white font-bold">
              {stats.assistantsActive} assistants
            </span>{" "}
            are currently active serving{" "}
            <span className="text-white font-bold">
              {stats.patientsCount} patients
            </span>{" "}
            at your hospital.
          </p>
        </div>
      </div>
    </div>
  );
}