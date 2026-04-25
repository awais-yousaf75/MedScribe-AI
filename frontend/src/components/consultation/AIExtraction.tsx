import { useState } from 'react';
import { Activity, Brain, Edit2, Save, FileText, LayoutDashboard, History, Settings, LogOut, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface AIExtractionProps {
  patientName: string;
  recordingData: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AIExtraction({ patientName, recordingData, onNavigate, onLogout }: AIExtractionProps) {
  const [insights, setInsights] = useState({
    symptoms: 'Persistent headaches (7/10 intensity), fatigue, mild dizziness, difficulty concentrating. Symptoms worsening in the afternoon. No visual disturbances or nausea.',
    diagnosis: 'Tension-type headache, possibly exacerbated by stress and poor sleep hygiene. Rule out hypertension and migraine.',
    advice: '1. Stress management techniques (meditation, deep breathing)\n2. Regular sleep schedule (7-8 hours)\n3. Adequate hydration (8 glasses daily)\n4. Regular exercise (30 min, 5x/week)\n5. Ergonomic workspace setup\n6. Follow-up in 2 weeks',
    avoidances: 'Food: Excessive caffeine, processed foods, alcohol\nActivities: Prolonged screen time without breaks, irregular sleep patterns, skipping meals\nMedications: Over-the-counter pain relievers (unless prescribed)',
  });

  const [isEditing, setIsEditing] = useState({
    symptoms: false,
    diagnosis: false,
    advice: false,
    avoidances: false,
  });

  const handleEdit = (field: keyof typeof insights, value: string) => {
    setInsights({ ...insights, [field]: value });
  };

  const toggleEdit = (field: keyof typeof isEditing) => {
    setIsEditing({ ...isEditing, [field]: !isEditing[field] });
  };

  const handleSave = () => {
    onNavigate('notes');
  };

  const handleGeneratePrescription = () => {
    onNavigate('prescription');
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
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
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl">AI Clinical Insights by MedScribe AI</h2>
              <p className="text-muted-foreground">
                Review and edit AI-extracted clinical information for {patientName}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">AI Analysis Complete</span>
            </div>
          </div>

          {/* Insight Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Symptoms Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-lg">Symptoms Extracted</h3>
                    <p className="text-xs text-muted-foreground">AI-identified patient complaints</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEdit('symptoms')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {isEditing.symptoms ? (
                <Textarea
                  value={insights.symptoms}
                  onChange={(e) => handleEdit('symptoms', e.target.value)}
                  className="min-h-[120px] bg-gray-50"
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-700">{insights.symptoms}</p>
              )}
            </div>

            {/* Diagnosis Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#14B8A6]" />
                  </div>
                  <div>
                    <h3 className="text-lg">AI-Suggested Diagnosis</h3>
                    <p className="text-xs text-muted-foreground">Preliminary clinical assessment</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEdit('diagnosis')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {isEditing.diagnosis ? (
                <Textarea
                  value={insights.diagnosis}
                  onChange={(e) => handleEdit('diagnosis', e.target.value)}
                  className="min-h-[120px] bg-gray-50"
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-700">{insights.diagnosis}</p>
              )}
            </div>

            {/* Medical Advice Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <div>
                    <h3 className="text-lg">Medical Advice & Lifestyle Tips</h3>
                    <p className="text-xs text-muted-foreground">Recommended care plan</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEdit('advice')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {isEditing.advice ? (
                <Textarea
                  value={insights.advice}
                  onChange={(e) => handleEdit('advice', e.target.value)}
                  className="min-h-[150px] bg-gray-50"
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{insights.advice}</p>
              )}
            </div>

            {/* Avoidances Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg">Avoidances</h3>
                    <p className="text-xs text-muted-foreground">Foods & activities to avoid</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEdit('avoidances')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {isEditing.avoidances ? (
                <Textarea
                  value={insights.avoidances}
                  onChange={(e) => handleEdit('avoidances', e.target.value)}
                  className="min-h-[150px] bg-gray-50"
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{insights.avoidances}</p>
              )}
            </div>
          </div>

          {/* AI Confidence Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-[#2563EB] flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="text-lg text-[#2563EB]">AI Confidence: 94%</h4>
                <p className="text-sm text-gray-700">
                  MedScribe AI has analyzed the consultation with high confidence. All suggestions 
                  are based on clinical evidence and should be reviewed by the physician before finalization.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('recording')}
              className="px-6 h-12 rounded-xl"
            >
              Back to Recording
            </Button>
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                variant="outline"
                className="px-6 h-12 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to MedScribe AI
              </Button>
              <Button
                onClick={handleGeneratePrescription}
                className="px-6 h-12 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Prescription
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
