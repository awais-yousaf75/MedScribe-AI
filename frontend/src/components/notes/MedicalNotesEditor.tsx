import { useState, useEffect } from 'react';
import { Activity, Save, FileText, History as HistoryIcon, Sparkles, LayoutDashboard, History, Settings, LogOut, Download, Loader2, Brain, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface MedicalNotesEditorProps {
  patientName: string;
  recordingData: any;
  extractedData: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function MedicalNotesEditor({ patientName, recordingData, extractedData, onNavigate, onLogout }: MedicalNotesEditorProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel] = useState<string>('');

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

  // Call NLP engine on mount
  useEffect(() => {
    const transcript = recordingData?.transcript;
    if (!transcript) {
      setError("No transcript available. Go back and record a consultation first.");
      setIsLoading(false);
      return;
    }
    generateNotes(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNotes = async (transcript: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${BASE_URL}/api/nlp/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          extracted_data: extractedData || null,
          consultation_id: recordingData?.consultationId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Notes generation failed");
      }

      setNotes(data.notes || "No notes generated");
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");

      // Save SOAP notes to Supabase (fire-and-forget)
      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ soap_notes: data.notes }),
        })
          .then((r) => r.json())
          .then((r) => {
            if (r.success) console.log("✅ SOAP notes saved to Supabase");
            else console.warn("⚠️ Could not save notes:", r.error);
          })
          .catch((e) => console.warn("⚠️ Save notes error:", e));
      }

      toast.success(`SOAP notes generated in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      console.error("Notes generation error:", err);
      setError(err.message || "Failed to generate notes");
      toast.error(err.message || "Notes generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center animate-pulse">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl">Generating SOAP Notes...</h2>
            <p className="text-muted-foreground max-w-md">
              MedScribe AI is creating structured clinical documentation from the consultation.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>This may take 10-20 seconds...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl">Notes Generation Failed</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate('extraction')}>
              Back to Extraction
            </Button>
            <Button
              onClick={() => generateNotes(recordingData?.transcript)}
              className="bg-gradient-to-r from-[#2563EB] to-[#14B8A6]"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => onNavigate('doctor-dashboard')}
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
                  <span className="text-sm">SOAP Notes — AI Generated</span>
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
                  placeholder="SOAP notes will appear here..."
                />
              </div>

              {/* Footer with timestamp */}
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>
                      Generated by {model || "MedScribe AI"}
                      {processingTime ? ` in ${processingTime}s` : ""}
                    </span>
                  </div>
                  <span>{notes.split(' ').length} words</span>
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
                  onClick={() => {
                    toast.success("Notes saved!");
                  }}
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
                  <span className="text-sm">{notes.split(' ').filter(Boolean).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Characters:</span>
                  <span className="text-sm">{notes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Model:</span>
                  <span className="text-sm text-[#2563EB]">{model || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
