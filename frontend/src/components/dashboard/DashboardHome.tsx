import { Activity, Clock, FileText, LayoutDashboard, History, Settings, LogOut, TrendingUp, Users, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface DashboardHomeProps {
  onNavigate: (page: string) => void;
  onStartConsultation: (patientName: string) => void;
  onLogout: () => void;
}

export default function DashboardHome({ onNavigate, onStartConsultation, onLogout }: DashboardHomeProps) {
  const [selectedPatient, setSelectedPatient] = useState('');

  const stats = [
    {
      label: "Today's Consultations",
      value: '12',
      icon: Users,
      color: 'from-[#2563EB] to-[#3B82F6]',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Average Time Saved',
      value: '28 min',
      icon: Clock,
      color: 'from-[#14B8A6] to-[#10B981]',
      bgColor: 'bg-teal-50',
    },
    {
      label: 'Prescriptions Generated',
      value: '34',
      icon: FileText,
      color: 'from-[#6366F1] to-[#8B5CF6]',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'AI Assistance Score',
      value: '97%',
      icon: Sparkles,
      color: 'from-[#22C55E] to-[#16A34A]',
      bgColor: 'bg-green-50',
    },
  ];

  const recentConsultations = [
    { id: 1, patient: 'Sarah Mitchell', date: 'Dec 17, 2025 - 10:30 AM', status: 'Completed', diagnosis: 'Hypertension Follow-up' },
    { id: 2, patient: 'James Wilson', date: 'Dec 17, 2025 - 09:15 AM', status: 'Completed', diagnosis: 'Type 2 Diabetes' },
    { id: 3, patient: 'Emily Chen', date: 'Dec 17, 2025 - 08:45 AM', status: 'Completed', diagnosis: 'Acute Bronchitis' },
    { id: 4, patient: 'Michael Brown', date: 'Dec 16, 2025 - 04:20 PM', status: 'Completed', diagnosis: 'Migraine Assessment' },
    { id: 5, patient: 'Lisa Anderson', date: 'Dec 16, 2025 - 03:00 PM', status: 'Completed', diagnosis: 'Annual Check-up' },
  ];

  const handleStartNewConsultation = () => {
    if (selectedPatient) {
      onStartConsultation(selectedPatient);
    } else {
      onStartConsultation('New Patient');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">MedScribe AI</h1>
              <p className="text-xs text-muted-foreground">Clinical Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-[#2563EB]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm">Dr. Ahmed Hassan</p>
                <p className="text-xs text-muted-foreground">Internal Medicine</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white">
                AH
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl">Welcome back, Dr. Ahmed 👋</h2>
          <p className="text-muted-foreground">
            MedScribe AI is ready to assist with today's consultations
          </p>
        </div>

        {/* Start Consultation Card */}
        <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-[#2563EB]/5 to-[#14B8A6]/5 border-2 border-[#2563EB]/20">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h3 className="text-2xl">Start New Consultation</h3>
              <p className="text-muted-foreground">
                Begin recording a patient consultation with AI-powered transcription and analysis
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter patient name (optional)"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white w-64"
                />
                <Button
                  onClick={handleStartNewConsultation}
                  className="h-12 px-8 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90 transition-all"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  Start Consultation
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
                <Activity className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Consultations */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl">Recent Consultations</h3>
            <Button
              variant="outline"
              onClick={() => onNavigate('history')}
              className="rounded-xl"
            >
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-4 text-sm text-muted-foreground">Patient Name</th>
                  <th className="text-left py-4 px-4 text-sm text-muted-foreground">Date & Time</th>
                  <th className="text-left py-4 px-4 text-sm text-muted-foreground">Diagnosis</th>
                  <th className="text-left py-4 px-4 text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-4 text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentConsultations.map((consultation) => (
                  <tr key={consultation.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-sm">
                          {consultation.patient.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{consultation.patient}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{consultation.date}</td>
                    <td className="py-4 px-4 text-sm">{consultation.diagnosis}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">
                        {consultation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('notes')}
                          className="rounded-lg"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('prescription')}
                          className="rounded-lg"
                        >
                          Prescription
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
