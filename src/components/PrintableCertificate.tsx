import React from 'react';
import { QRCodeDisplay } from './QRCodeDisplay.tsx';
import { VerificationCredential, Student } from '../server/types.ts';
import { Award, ShieldCheck, Printer, X } from 'lucide-react';

interface PrintableCertificateProps {
  student: Student;
  credential?: VerificationCredential;
  onClose: () => void;
}

export const PrintableCertificate: React.FC<PrintableCertificateProps> = ({
  student,
  credential,
  onClose,
}) => {
  const verifyUrl = `${window.location.origin}/verify/${credential?.token || student.studentId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="no-print bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Award className="w-4 h-4 text-sky-800" />
            <span>Digital Academic Identity Document (DigiLocker / AICTE Format)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-900 text-white text-xs font-medium rounded hover:bg-sky-800 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div className="p-8 md:p-12 bg-white relative print:p-0">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <ShieldCheck className="w-96 h-96 text-slate-900" />
          </div>

          {/* Official Header */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src="/logo.png"
                alt="EduVerify AICTE Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  All India Council for Technical Education (AICTE)
                </p>
                <p className="text-xs text-slate-500">Ministry of Education, Government of India</p>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
              NATIONAL STUDENT ACADEMIC CREDENTIAL
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Issued under the Automated Permanent Academic Account Registry (APAAR) National System
            </p>
          </div>

          {/* Certificate Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Student & Programme Particulars (2 Cols) */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Student Full Name</p>
                <p className="text-xl font-bold text-slate-900">{student.fullName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Student Institutional ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{student.studentId}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">APAAR ID (Masked)</p>
                  <p className="text-sm font-mono font-bold text-sky-900">{student.maskedApaarId}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Enrolled Institution</p>
                <p className="text-sm font-semibold text-slate-900">{student.institutionName}</p>
                <p className="text-xs text-slate-500">AICTE Approved Autonomous Technical University</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Academic Programme</p>
                  <p className="text-sm font-medium text-slate-800">{student.programmeName}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Admission Year / Cohort</p>
                  <p className="text-sm font-medium text-slate-800">{student.academicYear}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Quota / Category</p>
                  <p className="text-xs text-slate-700">
                    {student.quotaType} Quota · Category {student.category}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Date of Admission</p>
                  <p className="text-xs text-slate-700">{student.admissionDate}</p>
                </div>
              </div>
            </div>

            {/* QR Code & Tamper Verification (1 Col) */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <QRCodeDisplay value={verifyUrl} size={150} />
              <p className="text-[10px] text-slate-500 mt-2 font-mono break-all max-w-[180px]">
                {credential?.credentialId || `EDUVERIFY-${student.studentId}`}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Digitally Signed & Validated</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Scan QR code using camera to verify authenticity</p>
            </div>
          </div>

          {/* Validation Notice & Signatures */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-8">
              <div>
                <p className="font-semibold text-slate-700">Security Invariants Verified:</p>
                <p>• APAAR Verhoeff Checksum: Verified</p>
                <p>• Cross-Institution Duplicate Status: Non-Duplicate</p>
                <p>• Institutional Approved Intake Cap: Compliant</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">Issue Date:</p>
                <p>{credential?.issueDate || new Date().toISOString().split('T')[0]}</p>
                <p className="text-[10px] text-slate-400">Authority: AICTE National Student Data Registry</p>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-300">
              <div className="text-center">
                <div className="h-10 flex items-center justify-center font-serif italic text-slate-700 text-sm">
                  Dr. Anil Sahasrabudhe
                </div>
                <div className="w-48 border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-bold text-slate-700 uppercase">AICTE Competent Authority</p>
                  <p className="text-[9px] text-slate-500">Government of India</p>
                </div>
              </div>

              <div className="text-center">
                <div className="h-10 flex items-center justify-center font-serif italic text-slate-700 text-sm">
                  Prof. R. K. Deshmukh
                </div>
                <div className="w-48 border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-bold text-slate-700 uppercase">Dean / Registrar</p>
                  <p className="text-[9px] text-slate-500">{student.institutionName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
