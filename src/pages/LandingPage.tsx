import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onQuickVerify: (token: string) => void;
  onOpenRegisterModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onQuickVerify,
  onOpenRegisterModal,
}) => {
  const [quickToken, setQuickToken] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickToken.trim()) {
      onQuickVerify(quickToken.trim());
    }
  };

  const faqs = [
    {
      q: 'What is APAAR and why is it mandatory for higher education?',
      a: 'APAAR (Automated Permanent Academic Account Registry) is a unique 12-digit lifelong academic identifier created under the One Nation, One Student ID initiative. It connects directly with the Academic Bank of Credits (ABC) and ensures seamless credit accumulation, transfer, and tamper-evident credential verification across all AICTE-approved institutions.',
    },
    {
      q: 'How does EduVerify detect cross-institutional duplicate enrolments?',
      a: 'The platform employs an automated duplicate detection engine combining exact 12-digit APAAR hash collisions, Verhoeff checksum inspection, and normalized name/DOB biometric metadata. If a candidate attempts to occupy two subsidized or approved seats simultaneously at different colleges, a High-Risk Duplicate Alert is flagged immediately.',
    },
    {
      q: 'How does the intake monitoring engine calculate excess admissions?',
      a: 'Approved intake limits are set annually by AICTE. EduVerify calculates Regular Intake Utilization = (Regular Enrolment / Approved Intake) × 100. Any regular enrolment beyond the approved quota triggers an immediate Excess Admission Alert, separating regular seats from supernumerary quotas (NRI, OCI, FN, and EWS) according to regulatory rules.',
    },
    {
      q: 'Is personal data exposed inside the student verification QR code?',
      a: 'No. Adhering strictly to privacy-by-design and the Digital Personal Data Protection (DPDP) Act 2023, the QR code encodes only a cryptographic signed opaque token URL. Personal information such as unmasked APAAR ID, mobile numbers, and personal addresses are never placed directly into the 2D barcode.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-sky-950 via-sky-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-800/80 border border-sky-700/60 text-xs font-semibold text-teal-300">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>AICTE National Student Registry & Compliance Framework</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight text-balance">
            Building a Trusted Digital Academic Identity for Every Student
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            An integrated APAAR-based platform enabling secure student data management, real-time enrolment monitoring and verifiable academic records across AICTE-approved institutions.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenRegisterModal}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 text-sm font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Institution</span>
            </button>

            <button
              onClick={() => onNavigate('verify-public')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold rounded-lg backdrop-blur transition-all flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verify Student Credential</span>
            </button>
          </div>

          {/* Quick Verification Lookup Bar */}
          <div className="max-w-2xl mx-auto mt-10 p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/25 shadow-2xl">
            <form onSubmit={handleVerifySubmit} className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
              <input
                type="text"
                value={quickToken}
                onChange={(e) => setQuickToken(e.target.value)}
                placeholder="Enter Student ID or Verification Token (e.g. COEP-2024-CSE-001)"
                className="w-full px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-900 hover:bg-sky-800 text-white text-xs font-bold rounded-md transition-colors shrink-0"
              >
                Instant Verify
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-slate-300">
              <span>Try test ID:</span>
              <button
                onClick={() => setQuickToken('COEP-2024-CSE-001')}
                className="underline hover:text-white font-mono"
              >
                COEP-2024-CSE-001
              </button>
              <span>·</span>
              <button
                onClick={() => setQuickToken('IITD-2024-CSE-001')}
                className="underline hover:text-white font-mono"
              >
                IITD-2024-CSE-001
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL PROCESS FLOW SECTION */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-slate-200">
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-800">Operational Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            End-to-End Academic Identity Lifecycle
          </h2>
          <p className="text-xs text-slate-600 max-w-xl mx-auto">
            From institutional cohort ingestion to national cryptographic verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-xs font-bold text-slate-900">Institution</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Approved college admits student and captures academic profile under approved intake caps.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-xs font-bold text-slate-900">Student Registration</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Student enters 12-digit APAAR identifier or batch ingested through validated Excel/CSV pipelines.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded-xl border border-teal-200 bg-teal-50/30 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-xs font-bold text-slate-900">APAAR Validation</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verhoeff checksum inspection, format validation, and duplicate conflict scanning occur instantly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-xs font-bold text-slate-900">AICTE Repository</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Records are committed to the central national registry, updating live state and intake compliance metrics.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-sm">
              05
            </div>
            <h3 className="text-xs font-bold text-slate-900">QR Verification</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Employers and universities verify authenticity via signed QR codes without leaking sensitive PII.
            </p>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM FEATURES */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-slate-200">
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Enterprise Capabilities</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Architected for National Higher Education Scale
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">APAAR Validation Adapter</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates official Verhoeff check digits for 12-digit APAAR IDs, detecting missing, malformed, and duplicate identifiers with pluggable government gateway adapters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Cross-College Duplicate Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminates ghost enrolments and unauthorized seat reservation hoarding across engineering, management, and polytechnic colleges nationwide.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Automated Intake Compliance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Differentiates regular quota utilization from supernumerary quotas (NRI, OCI, Foreign National, EWS), alerting council inspectors instantly when approved intake is exceeded.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-slate-200">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Multi-Stakeholder Impact
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-sky-900 uppercase tracking-wider">For AICTE</p>
            <h3 className="text-sm font-bold text-slate-900">Centralized Oversight</h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Real-time visibility into student admissions across all states.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Instant flagging of colleges exceeding approved branch quotas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Automated generation of national statistical reports.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">For Institutions</p>
            <h3 className="text-sm font-bold text-slate-900">Streamlined Admissions</h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>High-speed batch upload of student cohorts via CSV/Excel.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Transparent tracking of approved seats vs. actual enrolments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Immediate warning if student APAAR IDs fail official checksums.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">For Students</p>
            <h3 className="text-sm font-bold text-slate-900">Verifiable Academic Identity</h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Cryptographic QR-based digital verification credentials.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Printable official verification certificate with AICTE stamp.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Granular consent control and audit trail of who verified records.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequently Asked Questions</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Technical & Regulatory Guidance
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
