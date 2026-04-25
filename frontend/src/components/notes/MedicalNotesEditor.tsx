import { useState } from 'react';
import { Activity, Save, FileText, History as HistoryIcon, Sparkles, LayoutDashboard, History, Settings, LogOut, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface MedicalNotesEditorProps {
  patientName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function MedicalNotesEditor({ patientName, onNavigate, onLogout }: MedicalNotesEditorProps) {
  const [notes, setNotes] = useState(`CLINICAL CONSULTATION NOTES

Patient: ${patientName}
Date: December 17, 2025
Time: 10:30 AM
Physician: Dr. Ahmed Hassan, MD

CHIEF COMPLAINT:
Patient presents with persistent headaches and fatigue over the past week.

HISTORY OF PRESENT ILLNESS:
Patient reports experiencing bilateral tension-type headaches with intensity of 7/10. Symptoms worsen in the afternoon and are accompanied by mild dizziness and difficulty concentrating. No visual disturbances, nausea, or vomiting reported. Patient denies trauma or recent illness.

PAST MEDICAL HISTORY:
- No significant past medical history
- No chronic conditions
- No previous hospitalizations

MEDICATIONS:
- None currently

ALLERGIES:
- No known drug allergies (NKDA)

PHYSICAL EXAMINATION:
- Blood Pressure: 128/82 mmHg
- Heart Rate: 76 bpm
- Temperature: 98.2°F
- General: Alert and oriented, appears mildly fatigued
- HEENT: No abnormalities detected
- Neurological: Intact, no focal deficits

ASSESSMENT:
Tension-type headache, likely exacerbated by stress and poor sleep hygiene. Rule out hypertension and migraine.

PLAN:
1. Stress management techniques (meditation, deep breathing exercises)
2. Regular sleep schedule (7-8 hours nightly)
3. Adequate hydration (8 glasses of water daily)
4. Regular exercise (30 minutes, 5 times per week)
5. Ergonomic workspace evaluation
6. Follow-up appointment in 2 weeks
7. If symptoms persist or worsen, consider imaging studies

PATIENT EDUCATION:
Discussed importance of lifestyle modifications, stress reduction, and maintaining regular sleep patterns. Patient understands the treatment plan and agrees to follow-up.`);

  const suggestedPhrases = [
    'No acute distress observed',
    'Patient is compliant with treatment',
    'Vitals within normal limits',
    'No concerning symptoms reported',
    'Patient education provided and understood',
    'Prescription explained to patient',
    'Follow-up scheduled as recommended',
    'HIPAA privacy notice acknowledged',
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
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Header */}
            <div className="space-y-2">
              <h2 className="text-3xl">Clinical Notes — MedScribe AI</h2>
              <p className="text-muted-foreground">
                Edit and finalize consultation documentation for {patientName}
              </p>
            </div>

            {/* Editor Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Toolbar */}
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Document Editor</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <HistoryIcon className="w-4 h-4 mr-2" />
                    Version History
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <div className="p-6">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[600px] font-mono text-sm leading-relaxed border-none focus-visible:ring-0 bg-white resize-none"
                  placeholder="Start typing your clinical notes..."
                />
              </div>

              {/* Footer with timestamp */}
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>Last AI update: 2 minutes ago</span>
                  </div>
                  <span>Auto-saved at 10:45 AM</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onNavigate('extraction')}
                className="px-6 h-12 rounded-xl"
              >
                Back to AI Insights
              </Button>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => alert('Notes saved!')}
                  className="px-6 h-12 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </Button>
                <Button
                  onClick={() => onNavigate('prescription')}
                  className="px-6 h-12 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90"
                >
                  Continue to Prescription
                </Button>
              </div>
            </div>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6 sticky top-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg">MedScribe AI Suggested Phrases</h3>
                  <p className="text-xs text-muted-foreground">Click to insert</p>
                </div>
              </div>

              <div className="space-y-2">
                {suggestedPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNotes(notes + '\n\n' + phrase)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all text-sm"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold text-[#2563EB]">Pro Tip:</span> Use AI-suggested 
                    phrases to maintain consistent documentation standards across all patient notes.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h4 className="text-sm text-muted-foreground">Document Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Word Count:</span>
                  <span className="text-sm">{notes.split(' ').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Characters:</span>
                  <span className="text-sm">{notes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sections:</span>
                  <span className="text-sm">9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
