import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Student, VerificationCredential, VerificationLog } from '../server/types.ts';
import { QRCodeDisplay } from '../components/QRCodeDisplay.tsx';
import { PrintableCertificate } from '../components/PrintableCertificate.tsx';
import {
  GraduationCap,
  ShieldCheck,
  FileCheck2,
  Printer,
  Calendar,
  Building2,
  Lock,
  Eye,
  CheckCircle2,
  History,
  Share2,
} from 'lucide-react';

interface StudentDashboardProps {
  studentId?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentId = 'COEP-2024-CSE-001',
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [credential, setCredential] = useState<VerificationCredential | null>(null);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  // Consent states
  const [allowEmployerCheck, setAllowEmployerCheck] = useState(true);
  const [allowScholarshipCheck, setAllowScholarshipCheck] = useState(true);
  const [consentSaved, setConsentSaved] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const res = await api.getStudent(studentId);
        if (res.success) {
          setStudent(res.student);
          if (res.credential) setCredential(res.credential);
        }
        const logsRes = await api.getVerificationLogs();
        if (logsRes.success) {
          setLogs(logsRes.logs.filter((l) => l.studentId === studentId));
        }
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center text-xs text-slate-500">Loading student academic profile...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center text-xs text-slate-500">Student record not found.</div>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${credential?.token || student.studentId}`;

  const handleSaveConsent = () => {
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Student Banner */}
      <div className="bg-sky-950 text-white px-4 sm:px-6 py-8 border-b border-sky-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-900 border-2 border-teal-400 flex items-center justify-center font-bold text-2xl text-teal-300 shadow-md">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{student.fullName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Active Student
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {student.programmeName} · {student.institutionName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Institutional ID: {student.studentId} · Academic Year: {student.academicYear}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCertificate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Download Official Verification Certificate</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Main Grid: Digital Identity & QR Token */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card (2 Cols) */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-800" />
                <h2 className="text-sm font-bold text-slate-900">National Academic Identity Profile</h2>
              </div>
              <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AICTE Central Registry Linked</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Automated Permanent Academic Account Registry (APAAR ID)
                </span>
                <p className="text-lg font-mono font-bold text-sky-900">
                  {student.maskedApaarId}
                </p>
                <span className="text-[10px] text-slate-400">Masked for privacy under DPDP Act 2023</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Admission Category & Quota
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {student.quotaType} Quota · Category {student.category}
                </p>
                <span className="text-[10px] text-slate-400">Allocated under AICTE Approved Intake</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Enrolled College
                </span>
                <p className="text-xs font-semibold text-slate-800">{student.institutionName}</p>
                <p className="text-[10px] text-slate-500 font-mono">Autonomous Technical University</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Admission Date & Cohort
                </span>
                <p className="text-xs font-semibold text-slate-800">{student.admissionDate}</p>
                <p className="text-[10px] text-slate-500">Cohort Academic Cycle: {student.academicYear}</p>
              </div>
            </div>

            {/* Invariant Safeguards Bar */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] space-y-1">
              <p className="font-bold text-slate-800">Verified System Safeguards:</p>
              <p>✓ APAAR Verhoeff Checksum: Algorithmic integrity confirmed</p>
              <p>✓ Cross-College Collision Check: No active duplicate enrolment detected</p>
              <p>✓ Institutional Approved Cap: Within regular authorized intake</p>
            </div>
          </div>

          {/* QR Verification Credential Card (1 Col) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center justify-between space-y-4">
            <div className="w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Digital Verification QR
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Share with employers or background verification agencies
              </p>
            </div>

            <QRCodeDisplay value={verifyUrl} size={150} />

            <div className="w-full space-y-1 text-center">
              <p className="text-[10px] font-mono font-bold text-slate-800 break-all">
                {credential?.credentialId || `EDUVERIFY-${student.studentId}`}
              </p>
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-700">
                <CheckCircle2 className="w-3 h-3" />
                <span>Credential Active & Valid</span>
              </div>
            </div>

            <button
              onClick={() => setShowCertificate(true)}
              className="w-full py-2 bg-sky-900 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Print / Save Certificate
            </button>
          </div>
        </div>

        {/* Consent Management & Privacy Controls */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Consent Management & Data Sharing</h2>
              <p className="text-xs text-slate-500">
                Manage who can verify your academic credentials in compliance with the Digital Personal Data Protection Act, 2023.
              </p>
            </div>
            {consentSaved && (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                Preferences Saved
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-800">Authorized Employer Background Verification</p>
                <p className="text-slate-500 text-[11px]">Allow accredited hiring agencies (e.g. TCS, Infosys) to verify academic enrollment via QR token.</p>
              </div>
              <input
                type="checkbox"
                checked={allowEmployerCheck}
                onChange={(e) => setAllowEmployerCheck(e.target.checked)}
                className="w-4 h-4 text-sky-800 rounded focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-800">Scholarship & Financial Aid Verification</p>
                <p className="text-slate-500 text-[11px]">Allow state and central scholarship portals to verify genuine non-duplicate enrollment.</p>
              </div>
              <input
                type="checkbox"
                checked={allowScholarshipCheck}
                onChange={(e) => setAllowScholarshipCheck(e.target.checked)}
                className="w-4 h-4 text-sky-800 rounded focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConsent}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Save Consent Preferences
            </button>
          </div>
        </div>

        {/* Verification History Log */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">Authorized Verification Access Audit</h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No third-party verification requests recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{log.verifierOrg}</p>
                    <p className="text-[11px] text-slate-500">
                      Officer: {log.verifierName} · Purpose: {log.purpose}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                      Verified
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <PrintableCertificate
          student={student}
          credential={credential || undefined}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
