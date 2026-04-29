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
} from "lucide-react";
import { Button } from "../../components/ui/button";

export default function OverviewPage({
  dashboard,
  loading,
  onRefresh,
  onNavigate,
}: {
  dashboard: any;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (page: "overview" | "doctors" | "assistants" | "hospital-profile") => void;
}) {
  const stats = dashboard?.stats || {
    doctorsActive: 0,
    doctorsInactive: 0,
    assistantsActive: 0,
    assistantsInactive: 0,
    patientsCount: 0,
    assistantsUnlinked: 0,
  };

  const hospital = dashboard?.hospital;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-extrabold text-white">Overview</h1>
            </div>
            <p className="text-white/90">
              {hospital ? `Managing: ${hospital.name}` : "No hospital assigned"}
            </p>
          </div>

          <Button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900">{stats.doctorsActive}</p>
                <p className="text-sm text-gray-600">Active Doctors</p>
                <p className="text-xs text-gray-500">{stats.doctorsInactive} inactive</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("doctors")}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0"
            >
              Manage Doctors <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900">{stats.assistantsActive}</p>
                <p className="text-sm text-gray-600">Active Assistants</p>
                <p className="text-xs text-gray-500">{stats.assistantsInactive} inactive</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("assistants")}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              Manage Assistants <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900">{stats.patientsCount}</p>
                <p className="text-sm text-gray-600">Patients (count only)</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
              Patient data is private. Only total count is displayed.
            </div>
          </div>
        </div>

        {/* ✅ Alerts panel */}
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">Alerts & Tasks</p>
                <p className="text-sm text-gray-600 mt-1">
                  Operational items that need your attention.
                </p>
              </div>
            </div>

            <Button
              onClick={() => onNavigate("assistants")}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Open Assistants
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Assistants not linked to a doctor
              </p>
              <p className="mt-2 text-3xl font-black text-gray-900">{stats.assistantsUnlinked}</p>
              <p className="text-sm text-amber-800/80 mt-1">
                These assistants can’t be routed to consultations properly until linked.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Action
              </p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                Go to <b>Assistants</b> → click <b>Link</b> and assign each assistant to a doctor.
              </p>
              <Button
                onClick={() => onNavigate("assistants")}
                className="mt-4 rounded-2xl bg-gray-900 text-white hover:bg-black"
              >
                Link assistants now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Hospital shortcut */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Hospital Profile</p>
            <p className="text-xl font-extrabold text-gray-900">
              {hospital?.name || "Not assigned"}
            </p>
            <p className="text-sm text-gray-600">
              {hospital?.status ? `Status: ${hospital.status}` : ""}
            </p>
          </div>
          <Button
            onClick={() => onNavigate("hospital-profile")}
            className="rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0"
          >
            View Hospital Profile <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}