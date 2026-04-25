import { useState } from 'react';
import { Activity, Calendar, Download, Eye, Filter, History, LayoutDashboard, LogOut, Search, Settings, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ConsultationHistoryProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function ConsultationHistory({ onNavigate, onLogout }: ConsultationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const consultations = [
    { id: 1, patient: 'Sarah Mitchell', date: 'Dec 17, 2025', time: '10:30 AM', diagnosis: 'Hypertension Follow-up', status: 'Completed', duration: '15 min' },
    { id: 2, patient: 'James Wilson', date: 'Dec 17, 2025', time: '09:15 AM', diagnosis: 'Type 2 Diabetes', status: 'Completed', duration: '22 min' },
    { id: 3, patient: 'Emily Chen', date: 'Dec 17, 2025', time: '08:45 AM', diagnosis: 'Acute Bronchitis', status: 'Completed', duration: '18 min' },
    { id: 4, patient: 'Michael Brown', date: 'Dec 16, 2025', time: '04:20 PM', diagnosis: 'Migraine Assessment', status: 'Completed', duration: '20 min' },
    { id: 5, patient: 'Lisa Anderson', date: 'Dec 16, 2025', time: '03:00 PM', diagnosis: 'Annual Check-up', status: 'Completed', duration: '25 min' },
    { id: 6, patient: 'Robert Taylor', date: 'Dec 16, 2025', time: '02:15 PM', diagnosis: 'Lower Back Pain', status: 'Completed', duration: '17 min' },
    { id: 7, patient: 'Jennifer Lee', date: 'Dec 16, 2025', time: '11:30 AM', diagnosis: 'Allergic Rhinitis', status: 'Completed', duration: '12 min' },
    { id: 8, patient: 'David Martinez', date: 'Dec 15, 2025', time: '04:45 PM', diagnosis: 'Gastroesophageal Reflux', status: 'Completed', duration: '19 min' },
  ];

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
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-[#2563EB]"
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
        {/* Page Header */}
        <div className="space-y-2">
          <h2 className="text-3xl">Consultation History — MedScribe AI</h2>
          <p className="text-muted-foreground">
            View and manage all past consultations with AI-generated insights
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by patient name or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-2"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select className="pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 bg-white appearance-none cursor-pointer">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>All time</option>
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <Button variant="outline" className="h-12 px-6 rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-sm text-muted-foreground">Patient</th>
                  <th className="text-left py-4 px-6 text-sm text-muted-foreground">Date & Time</th>
                  <th className="text-left py-4 px-6 text-sm text-muted-foreground">Diagnosis</th>
                  <th className="text-left py-4 px-6 text-sm text-muted-foreground">Duration</th>
                  <th className="text-left py-4 px-6 text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-6 text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation) => (
                  <tr key={consultation.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-sm">
                          {consultation.patient.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p>{consultation.patient}</p>
                          <p className="text-xs text-muted-foreground">ID: #{consultation.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p>{consultation.date}</p>
                        <p className="text-xs text-muted-foreground">{consultation.time}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm">{consultation.diagnosis}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{consultation.duration}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">
                        {consultation.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('notes')}
                          className="rounded-lg"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('prescription')}
                          className="rounded-lg"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Prescription
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-muted-foreground">
              Showing 1-8 of 48 consultations
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg">
                Previous
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg bg-[#2563EB] text-white">
                1
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg">
                2
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg">
                3
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
