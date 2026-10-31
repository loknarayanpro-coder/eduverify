import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Student,
  Institution,
  BulkUploadRecord,
  VerificationCredential,
} from '../server/types.ts';
import { PrintableCertificate } from '../components/PrintableCertificate.tsx';
import {
  Building2,
  Users,
  UserPlus,
  Upload,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Download,
  Search,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface InstitutionDashboardProps {
  institutionId?: string;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({
  institutionId = 'inst-coep-pune',
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'add' | 'bulk' | 'history' | 'intake'>('roster');
  const [loading, setLoading] = useState(true);

  const [institution, setInstitution] = useState<any | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadHistory, setUploadHistory] = useState<BulkUploadRecord[]>([]);

  // Search & filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Certificate modal
  const [certificateStudent, setCertificateStudent] = useState<Student | null>(null);
  const [selectedCred, setSelectedCred] = useState<VerificationCredential | undefined>(undefined);

  // New Student Form state
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    apaarId: '',
    dateOfBirth: '2005-01-01',
    gender: 'MALE' as const,
    email: '',
    mobile: '+91-',
    category: 'GENERAL' as const,
    quotaType: 'REGULAR' as const,
    programmeName: 'B.Tech in Computer Engineering',
    academicYear: '2024-2025',
    admissionDate: new Date().toISOString().split('T')[0],
  });
  const [apaarValidationPreview, setApaarValidationPreview] = useState<any>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Bulk upload state
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadSummary, setUploadSummary] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, stuRes, histRes] = await Promise.all([
        api.getInstitution(institutionId),
        api.getStudents({ institutionId }),
        api.getUploadHistory(institutionId),
      ]);

      if (instRes.success) setInstitution(instRes.institution);
      if (stuRes.success) setStudents(stuRes.students);
      if (histRes.success) setUploadHistory(histRes.uploads);
    } catch (err) {
      console.error('Failed to load institution data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [institutionId]);

  // Handle live APAAR check as user types
  const handleApaarChange = async (val: string) => {
    setFormData((prev) => ({ ...prev, apaarId: val }));
    if (val.trim().length >= 12) {
      const res = await api.validateApaar(val);
      if (res.success) {
        setApaarValidationPreview(res.result);
      }
    } else {
      setApaarValidationPreview(null);
    }
  };

  const handleGenerateSandboxApaar = async () => {
    try {
      const res = await api.generateSampleApaar();
      if (res.success && res.apaarId) {
        setFormData((prev) => ({ ...prev, apaarId: res.apaarId }));
        setApaarValidationPreview(res.result);
      }
    } catch (err) {
      console.error('Failed to generate sample APAAR:', err);
    }
  };

  // Submit Add Student Form
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.fullName || !formData.studentId) {
      setFormError('Student Full Name and Institutional Student ID are required.');
      return;
    }

    try {
      const res = await api.createStudent({
        ...formData,
        institutionId,
      });

      if (res.success) {
        setFormSuccess(`Student ${res.student.fullName} enrolled successfully.`);
        if (res.duplicateAlert) {
          setFormError(`Warning: Potential duplicate conflict flagged (${res.duplicateAlert.reason}). Sent to AICTE for review.`);
        }
        // Reset form
        setFormData({
          fullName: '',
          studentId: '',
          apaarId: '',
          dateOfBirth: '2005-01-01',
          gender: 'MALE',
          email: '',
          mobile: '+91-',
          category: 'GENERAL',
          quotaType: 'REGULAR',
          programmeName: 'B.Tech in Computer Engineering',
          academicYear: '2024-2025',
          admissionDate: new Date().toISOString().split('T')[0],
        });
        setApaarValidationPreview(null);
        loadData();
      } else {
        setFormError(res.message || 'Failed to create student record.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Submission error');
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      await api.deleteStudent(id);
      loadData();
    }
  };

  // View Certificate
  const handleViewCertificate = async (student: Student) => {
    const res = await api.getStudent(student.id);
    if (res.success) {
      setCertificateStudent(res.student);
      setSelectedCred(res.credential);
    }
  };

  // Bulk CSV parser
  const handleParseCsv = (content: string) => {
    setCsvContent(content);
    const lines = content.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }
    setParsedRows(rows);
  };

  // Commit Bulk Upload
  const handleCommitBulkUpload = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setUploadSummary(null);

    try {
      const res = await api.uploadStudents(
        institutionId,
        `batch_upload_${Date.now()}.csv`,
        parsedRows
      );
      if (res.success) {
        setUploadSummary(res.summary);
        setParsedRows([]);
        setCsvContent('');
        loadData();
      }
    } catch (err) {
      console.error('Bulk upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample = `studentId,fullName,apaarId,dateOfBirth,gender,email,mobile,category,quotaType,programmeName,academicYear\nCOEP-2024-CSE-091,Manish Kulkarni,984321098451,2005-03-12,MALE,manish.k@coep.ac.in,+91-9822001122,GENERAL,REGULAR,B.Tech Computer Engineering,2024-2025\nCOEP-2024-CSE-092,Sneha Deshmukh,872109438218,2005-09-18,FEMALE,sneha.d@coep.ac.in,+91-9822003344,OBC,REGULAR,B.Tech Computer Engineering,2024-2025\nCOEP-2024-CSE-093,Rahul Verma,,2004-12-05,MALE,rahul.v@coep.ac.in,+91-9822005566,EWS,REGULAR,B.Tech Computer Engineering,2024-2025`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eduverify_sample_student_template.csv';
    link.click();
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.apaarId.includes(search);
    const matchStatus = statusFilter === 'ALL' || s.apaarStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const analysis = institution?.analysis;
  const isExceeded = analysis?.isExceeded;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* College Header */}
      <div className="bg-sky-900 text-white px-4 sm:px-6 py-6 border-b border-sky-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
              <Building2 className="w-4 h-4" />
              <span>AICTE Autonomous Technical Institution · AISHE: {institution?.aisheCode || 'C-41584'}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {institution?.name || 'COEP Technological University'}
            </h1>
            <p className="text-xs text-slate-300">
              AICTE Approval Reference: <span className="font-mono font-bold">{institution?.aicteApprovalId}</span> · {institution?.state}
            </p>
          </div>

          {/* Quick Intake Banner */}
          <div className="flex items-center gap-4 bg-sky-950/60 p-3 rounded-xl border border-sky-800/80">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Intake Quota Utilization</span>
              <span className="text-lg font-bold font-mono text-white">
                {analysis?.regularEnrolment || 0} / {institution?.approvedIntake || 60} Seats
              </span>
            </div>
            <div className={`px-2.5 py-1 rounded text-xs font-bold ${
              isExceeded ? 'bg-rose-600 text-white animate-pulse' : 'bg-teal-500 text-slate-950'
            }`}>
              {isExceeded ? `+${analysis.excessAdmissions} Excess` : `${analysis?.regularUtilizationPercent}% Used`}
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold border-t border-sky-800/60 pt-3">
          {[
            { id: 'roster', label: `Student Roster (${students.length})` },
            { id: 'add', label: 'Add Student Record' },
            { id: 'bulk', label: 'Bulk CSV / Excel Upload' },
            { id: 'history', label: 'Upload History' },
            { id: 'intake', label: 'Intake & Supernumerary Quotas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-sky-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Excess Admission Alert Banner */}
        {isExceeded && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-950">Approved Intake Exceeded Warning</p>
                <p className="mt-0.5 leading-relaxed">
                  Your current regular enrolment ({analysis.regularEnrolment}) exceeds the AICTE approved capacity of {institution.approvedIntake} by {analysis.excessAdmissions} students.
                  Please review student records or submit an intake regularization application to the Council.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: STUDENT ROSTER
           ========================================================================= */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, APAAR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-sky-800"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="ALL">All APAAR Statuses</option>
                  <option value="VALID">Valid</option>
                  <option value="INVALID">Invalid</option>
                  <option value="DUPLICATE">Duplicate</option>
                </select>

                <button
                  onClick={() => setActiveTab('add')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded shadow-sm transition-colors whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Student</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Student ID & Name</th>
                    <th className="py-3 px-4">Masked APAAR ID</th>
                    <th className="py-3 px-4">Admission Category & Quota</th>
                    <th className="py-3 px-4 text-center">APAAR Validation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {s.studentId} · DOB: {s.dateOfBirth}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-900">
                        {s.maskedApaarId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{s.quotaType}</span>
                        <span className="text-[11px] text-slate-500 block">Category: {s.category}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.apaarStatus === 'VALID'
                              ? 'bg-teal-100 text-teal-800'
                              : s.apaarStatus === 'DUPLICATE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.apaarStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleViewCertificate(s)}
                          className="px-2.5 py-1 bg-sky-900 text-white rounded text-[11px] font-semibold hover:bg-sky-800 inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Credential</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ADD STUDENT ENROLMENT FORM
           ========================================================================= */}
        {activeTab === 'add' && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-base font-bold text-slate-900">Enroll New Student</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register student under approved AICTE programme with real-time Verhoeff APAAR validation.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-lg">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siddharth Joshi"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-sky-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Student ID / Roll *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COEP-2024-CSE-099"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-sky-800 font-mono"
                  />
                </div>
              </div>

              {/* APAAR ID with Real-Time Validation Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    12-Digit APAAR ID (Automated Permanent Academic Account Registry)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSandboxApaar}
                    className="text-[11px] font-semibold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition-colors"
                  >
                    🎲 Generate Valid Sandbox APAAR
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="Enter 12-digit number (e.g. 984321098451)"
                    value={formData.apaarId}
                    onChange={(e) => handleApaarChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-sky-800 font-mono tracking-wider"
                  />
                </div>

                {apaarValidationPreview && (
                  <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    apaarValidationPreview.isValid
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {apaarValidationPreview.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>
                        {apaarValidationPreview.isValid
                          ? 'Valid APAAR ID: Verhoeff checksum verified successfully.'
                          : apaarValidationPreview.errors.join(' ')}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold">
                      {apaarValidationPreview.code}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quota Type *</label>
                  <select
                    value={formData.quotaType}
                    onChange={(e) => setFormData({ ...formData, quotaType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white font-medium"
                  >
                    <option value="REGULAR">Regular Quota (Approved Intake)</option>
                    <option value="NRI">NRI (Supernumerary)</option>
                    <option value="OCI">OCI (Supernumerary)</option>
                    <option value="FOREIGN_NATIONAL">Foreign National</option>
                    <option value="SUPERNUMERARY">Supernumerary (Other)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC (Non-Creamy Layer)</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="EWS">Economically Weaker Section (EWS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Programme</label>
                  <input
                    type="text"
                    value={formData.programmeName}
                    onChange={(e) => setFormData({ ...formData, programmeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2 border border-slate-200 rounded text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-900 hover:bg-sky-800 text-white font-bold rounded shadow transition-colors"
                >
                  Confirm Enrolment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BULK CSV / EXCEL UPLOAD
           ========================================================================= */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bulk Student Data Ingestion</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import entire cohorts using CSV or Excel formats with automatic pre-import validation.
                </p>
              </div>
              <button
                onClick={handleDownloadSampleCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded border border-slate-200 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {uploadSummary && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                <p className="font-bold text-sm">Batch Ingestion Completed</p>
                <p>
                  Successfully imported <span className="font-bold">{uploadSummary.imported}</span> of <span className="font-bold">{uploadSummary.total}</span> records.
                  {uploadSummary.invalid > 0 && ` (${uploadSummary.invalid} invalid format errors)`}
                  {uploadSummary.duplicates > 0 && ` (${uploadSummary.duplicates} duplicate conflicts detected)`}
                </p>
              </div>
            )}

            {/* Paste or Upload Area */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <label className="block text-xs font-bold text-slate-800">
                Paste CSV Data or Load Template
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => handleParseCsv(e.target.value)}
                placeholder="Paste CSV text here (columns: studentId, fullName, apaarId, dateOfBirth, gender, email, mobile, category, quotaType, programmeName, academicYear)..."
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-800"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const sample = `studentId,fullName,apaarId,dateOfBirth,gender,email,mobile,category,quotaType,programmeName,academicYear\nCOEP-2024-CSE-091,Manish Kulkarni,984321098451,2005-03-12,MALE,manish.k@coep.ac.in,+91-9822001122,GENERAL,REGULAR,B.Tech Computer Engineering,2024-2025\nCOEP-2024-CSE-092,Sneha Deshmukh,872109438218,2005-09-18,FEMALE,sneha.d@coep.ac.in,+91-9822003344,OBC,REGULAR,B.Tech Computer Engineering,2024-2025\nCOEP-2024-CSE-093,Rahul Verma,984321098450,2004-12-05,MALE,rahul.v@coep.ac.in,+91-9822005566,EWS,REGULAR,B.Tech Computer Engineering,2024-2025`;
                    handleParseCsv(sample);
                  }}
                  className="text-xs text-sky-800 font-semibold underline"
                >
                  Load Pre-filled Demo Batch
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">
                    {parsedRows.length} rows parsed
                  </span>
                  <button
                    disabled={parsedRows.length === 0 || uploading}
                    onClick={handleCommitBulkUpload}
                    className="px-4 py-2 bg-sky-900 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Processing Batch...' : 'Validate & Import Cohort'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-800">
                  Pre-Import Validation Preview ({parsedRows.length} Records)
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Student ID</th>
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3">APAAR ID</th>
                      <th className="py-2 px-3">Quota</th>
                      <th className="py-2 px-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.studentId}</td>
                        <td className="py-2 px-3 font-sans">{r.fullName}</td>
                        <td className="py-2 px-3 text-sky-900">{r.apaarId || 'MISSING'}</td>
                        <td className="py-2 px-3">{r.quotaType}</td>
                        <td className="py-2 px-3">{r.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: UPLOAD HISTORY
           ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Cohort Upload Audit History</h2>
              <p className="text-xs text-slate-500">Historical records of bulk student uploads and validation logs.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Upload ID & File</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-center">Total Records</th>
                    <th className="py-3 px-4 text-center">Imported</th>
                    <th className="py-3 px-4 text-center">Invalid Format</th>
                    <th className="py-3 px-4 text-center">Duplicates Flagged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {uploadHistory.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-slate-900 block">{u.fileName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(u.uploadedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{u.totalRecords}</td>
                      <td className="py-3 px-4 text-center font-bold text-teal-700">{u.successfulImports}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{u.invalidRecords}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{u.duplicateRecords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: INTAKE & SUPERNUMERARY QUOTAS
           ========================================================================= */}
        {activeTab === 'intake' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Institutional Admission & Quota Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Approved AICTE Cap</span>
                  <p className="text-2xl font-bold font-mono text-slate-900">{institution?.approvedIntake}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Regular Enrolled</span>
                  <p className={`text-2xl font-bold font-mono ${isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
                    {analysis?.regularEnrolment}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className="text-[11px] font-bold uppercase text-slate-500">NRI Admissions (5% Quota)</span>
                  <p className="text-2xl font-bold font-mono text-teal-800">{institution?.nriEnrolment}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Foreign Nationals (10% Quota)</span>
                  <p className="text-2xl font-bold font-mono text-teal-800">{institution?.foreignEnrolment}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      {certificateStudent && (
        <PrintableCertificate
          student={certificateStudent}
          credential={selectedCred}
          onClose={() => setCertificateStudent(null)}
        />
      )}
    </div>
  );
};
