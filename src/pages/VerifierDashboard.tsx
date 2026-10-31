import React, { useState } from 'react';
import { api } from '../services/api.ts';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileCheck2,
  Briefcase,
  History,
} from 'lucide-react';

export const VerifierDashboard: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [verifierOrg, setVerifierOrg] = useState('Tata Consultancy Services');
  const [verifierName, setVerifierName] = useState('Priya Nair');
  const [purpose, setPurpose] = useState('Campus Recruitment Background Verification');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMsg('');

    try {
      const res = await api.verifyCredential(
        tokenInput.trim(),
        verifierOrg,
        verifierName,
        purpose
      );

      if (res.success && res.credential) {
        setResult(res.credential);
      } else {
        setErrorMsg(res.message || 'Credential validation failed or record was not found.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error verifying credential');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (val: string) => {
    setTokenInput(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Verifier Header */}
      <div className="bg-sky-950 text-white px-4 sm:px-6 py-8 border-b border-sky-900">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Briefcase className="w-4 h-4" />
            <span>Authorized Third-Party Verifier Portal · Employer & Accreditation Screener</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Academic Credential Verification Engine</h1>
          <p className="text-xs text-slate-300">
            Verify official AICTE institutional enrolment and tamper-evident student credentials via QR tokens or Student IDs.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Verification Form Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Input Verification Token or Student ID</h2>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Paste QR verification token or student ID (e.g. COEP-2024-CSE-001)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-800 font-mono"
                />
              </div>

              {/* Sample test buttons */}
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                <span>Sample valid records:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('COEP-2024-CSE-001')}
                  className="underline hover:text-sky-900 font-mono"
                >
                  COEP-2024-CSE-001
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('IITD-2024-CSE-001')}
                  className="underline hover:text-sky-900 font-mono"
                >
                  IITD-2024-CSE-001
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('ANNA-2024-ECE-012')}
                  className="underline hover:text-sky-900 font-mono"
                >
                  ANNA-2024-ECE-012
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('tok_sig_a8f9c2e1b40d7e63f912c4')}
                  className="underline hover:text-sky-900 font-mono"
                  title="Signed HMAC Credential Token"
                >
                  Signed Token
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verifying Organization</label>
                <input
                  type="text"
                  value={verifierOrg}
                  onChange={(e) => setVerifierOrg(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verifier Agent Name</label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-900 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-colors"
              >
                {loading ? 'Validating Token...' : 'Execute Authenticity Check'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Credential Verification Failed</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Verification Card */}
        {result && (
          <div className="bg-white rounded-xl border border-teal-200 shadow-md overflow-hidden space-y-4">
            {/* Stamp Header */}
            <div className="bg-teal-50 border-b border-teal-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-teal-950">AUTHENTIC ACADEMIC CREDENTIAL VERIFIED</h3>
                  <p className="text-[11px] text-teal-800">
                    Validated by AICTE National Central Registry on {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-teal-200/80 text-teal-900 rounded">
                STATUS: {result.status}
              </span>
            </div>

            {/* Credential Data Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Candidate Full Name</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{result.studentName}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Institutional Student ID</span>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{result.studentId}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Enrolled Institution</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{result.institutionName}</p>
                <span className="text-[10px] text-teal-700 font-semibold">AICTE Approved Autonomous Institution</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Academic Programme</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{result.programmeName}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Academic Year & Admission Date</span>
                <p className="text-xs text-slate-700 mt-0.5">{result.academicYear} · Admitted {result.admissionDate}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Masked APAAR Identifier</span>
                <p className="text-xs font-mono font-bold text-sky-900 mt-0.5">{result.maskedApaar}</p>
              </div>
            </div>

            {/* Security Audit Badge */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Security Invariant: Verified non-duplicate student with official Verhoeff check.</span>
              <span className="font-mono">Audit ID: {result.credentialId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
