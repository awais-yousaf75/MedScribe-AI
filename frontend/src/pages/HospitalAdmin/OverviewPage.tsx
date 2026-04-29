import React from "react";
import { Building2, RefreshCw, Stethoscope, UserCog, Users, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function HospitalAdminOverviewPage({
  dashboard,
  loading,
  onRefresh,
  onNavigate,
}: {
  dashboard: any;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (page: string) => void;
}) {
  const stats = dashboard?.stats || {
    pendingDoctors: 0,
    pendingAssistants: 0,
    approvedDoctors: 0,
    approvedAssistants: 0,
    patientsCount: 0,
    totalPending: 0,
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
              <h1 className="text-3xl font-extrabold text-white">Hospital Admin Overview</h1>
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
                <p className="text-3xl font-black text-gray-900">{stats.pendingDoctors}</p>
                <p className="text-sm text-gray-600">Pending Doctors</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("pending-doctors")}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0"
            >
              Review Doctors <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900">{stats.pendingAssistants}</p>
                <p className="text-sm text-gray-600">Pending Assistants</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate("pending-assistants")}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              Review Assistants <ArrowRight className="w-4 h-4 ml-2" />
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
              Privacy mode enabled: only total patient count is shown.
            </div>
          </div>
        </div>

        {/* Secondary summary */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">At a glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-500 font-semibold">Approved Doctors</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{stats.approvedDoctors}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-500 font-semibold">Approved Assistants</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{stats.approvedAssistants}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-500 font-semibold">Total Pending Approvals</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{stats.totalPending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}