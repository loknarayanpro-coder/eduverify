import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, GraduationCap, Calendar, ArrowLeft } from 'lucide-react';

interface PublicVerifyPageProps {
  initialToken?: string;
  onNavigate: (view: string) => void;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({
  initialToken = 'COEP-2024-CSE-001',
  onNavigate,
}) => {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const executeVerification = async (tokToVerify: string) => {
    if (!tokToVerify.trim()) return;
    setLoading(true);
    setResult(null);
    setErrorMsg('');

    try {
      const res = await api.verifyCredential(
        tokToVerify.trim(),
        'Public Web Scanner',
        'Direct QR Scan',
        'Public Identity Verification'
      );

      if (res.success && res.credential) {
        setResult(res.credential);
      } else {
        setErrorMsg(res.message || 'Credential is invalid or not registered in the AICTE National Registry.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error verifying credential');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      executeVerification(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerification(token);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to National Portal</span>
        </button>

        {/* Verification Search Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-900 mx-auto flex items-center justify-center font-bold text-lg">
            EV
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">National Academic Credential Verification</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scan or enter the verification token to confirm enrollment authenticity directly against the AICTE Central Student Registry.
          </p>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md mx-auto pt-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token or Student ID..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-sky-800 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-sky-900 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded shrink-0 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>

        {/* Result Area */}
        {errorMsg && (
          <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Verification Unsuccessful</p>
              <p className="mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl border border-teal-200 shadow-xl overflow-hidden">
            {/* Stamp Header */}
            <div className="bg-teal-50 border-b border-teal-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal-600" />
                <div>
                  <h2 className="text-sm font-bold text-teal-950">AUTHENTIC ACADEMIC CREDENTIAL VERIFIED</h2>
                  <p className="text-[11px] text-teal-800">
                    Officially validated by the AICTE National Registry under the Ministry of Education
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-teal-200 text-teal-900 rounded">
                STATUS: {result.status}
              </span>
            </div>

            {/* Information Grid */}
            <div className="p-6 space-y-4 text-xs">
              <div className="border-b pb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">Student Name</span>
                <p className="text-xl font-bold text-slate-900">{result.studentName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Student ID</span>
                  <p className="font-mono font-bold text-slate-900">{result.studentId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Masked APAAR ID</span>
                  <p className="font-mono font-bold text-sky-900">{result.maskedApaar}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Enrolled Institution</span>
                <p className="font-semibold text-slate-900">{result.institutionName}</p>
                <p className="text-[11px] text-slate-500">Autonomous Technical Institution ({result.institutionState})</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Programme</span>
                  <p className="font-medium text-slate-800">{result.programmeName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Academic Year</span>
                  <p className="font-medium text-slate-800">{result.academicYear}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Credential ID: {result.credentialId}</span>
                <span>Verified: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
