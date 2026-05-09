import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Activity, Save, FileText, History as HistoryIcon, Sparkles, LayoutDashboard, History, Settings, LogOut, Download, Loader2, Brain, AlertCircle, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface MedicalNotesEditorProps {
  patientName: string;
  recordingData: any;
  extractedData: any;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function MedicalNotesEditor({ patientName, recordingData, extractedData, onLogout }: MedicalNotesEditorProps) {
  const navigate = useNavigate();
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
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-danger">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="page-header-title">Generation Failed</h1>
                <p className="page-header-sub">MedScribe AI encountered an error</p>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-danger">
              <AlertCircle size={28} />
            </div>
            <div className="aix-state-body text-center">
              <h2 className="aix-state-title">Notes Generation Failed</h2>
              <p className="aix-state-sub max-w-md mx-auto">{error}</p>
            </div>
            <div className="aix-state-actions">
              <Button variant="outline" className="btn-md" onClick={() => navigate('/doctor/extraction')}>
                Back to Extraction
              </Button>
              <Button
                onClick={() => generateNotes(recordingData?.transcript)}
                className="btn-send-premium btn-md"
              >
                Retry Generation
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dl-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal shadow-teal-100">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-header-title">Clinical SOAP Documentation</h1>
              <p className="page-header-sub">
                Refining consultation records for {patientName || "Patient"}
              </p>
            </div>
          </div>
          <div className="page-header-actions">
            <Button
              variant="outline"
              onClick={() => {
                toast.success("Draft saved to medical record");
              }}
              className="btn-print-premium btn-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => navigate('/doctor/prescription')}
              className="btn-send-premium btn-md"
            >
              Finalize Notes
              <Activity className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Editor Card */}
            <div className="rx-document">
              <div className="rx-letterhead-accent" />
              {/* Toolbar */}
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    AI-Generated Clinical Structure
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
                    <HistoryIcon className="w-3.5 h-3.5 mr-1.5" />
                    History
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Editor Content Area */}
              <div className="p-10 relative bg-white min-h-[700px]">
                {/* Clinical Notebook Texture */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                     style={{ backgroundImage: 'linear-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '100% 3rem' }} />
                <div className="absolute left-16 top-0 bottom-0 w-[1px] bg-red-100 opacity-50 pointer-events-none" />
                
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full font-mono text-[15px] leading-[3rem] border-none focus-visible:ring-0 bg-transparent resize-none p-0 relative z-10 text-gray-800 placeholder:text-gray-300"
                  style={{ minHeight: '650px' }}
                  placeholder="Subjective:
Patient reports...

Objective:
Vitals: BP 120/80...

Assessment:
Preliminary diagnosis...

Plan:
Treatment initiated..."
                />
              </div>

              {/* Footer with timestamp */}
              <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-teal-600" />
                      <span>{model || "MedScribe-v2.5-Pro"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Processed in {processingTime || "12.4"}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 uppercase tracking-widest">
                    <span>{notes.split(' ').filter(Boolean).length} Words</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{notes.length} Chars</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => navigate('/doctor/extraction')}
                className="btn-print-premium btn-md"
              >
                Back to Extraction
              </Button>
            </div>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6 sticky top-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
                  <Sparkles className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Clinical Wisdom</h3>
                  <p className="text-[10px] uppercase tracking-widest text-teal-600 font-bold">Smart Suggestions</p>
                </div>
              </div>

              <div className="space-y-2">
                {suggestedPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNotes(notes + '\n\n' + phrase)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-gray-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all text-xs font-medium text-gray-700 shadow-sm hover:shadow-md"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-100/50">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-teal-700 uppercase tracking-tighter mr-1">Pro Tip:</span> 
                    Insert AI-suggested phrases to maintain documentation standards across all clinical notes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
