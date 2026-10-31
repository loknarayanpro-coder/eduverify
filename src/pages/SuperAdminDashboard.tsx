import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Institution,
  Student,
  DuplicateAlert,
  AuditLog,
} from '../server/types.ts';
import {
  IntakeComparisonChart,
  ApaarDistributionDonut,
  HorizontalCategoryBar,
} from '../components/Charts.tsx';
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle,
  AlertOctagon,
  Download,
  Search,
  Filter,
  Check,
  Ban,
  Clock,
  Eye,
  FileSpreadsheet,
  X,
  ExternalLink,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'institutions' | 'students' | 'duplicates' | 'intake' | 'audit' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [institutions, setInstitutions] = useState<(Institution & { analysis: any })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateAlert[]>([]);
  const [intakeData, setIntakeData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filtering states
  const [instSearch, setInstSearch] = useState('');
  const [instStateFilter, setInstStateFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCategoryFilter, setStudentCategoryFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  // Modal states
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateAlert | null>(null);
  const [selectedInst, setSelectedInst] = useState<any | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, instRes, stuRes, dupRes, intakeRes, auditRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getInstitutions(),
        api.getStudents(),
        api.getDuplicates(),
        api.getIntakeStats(),
        api.getAuditLogs(),
      ]);

      if (analyticsRes.success) setStats(analyticsRes.stats);
      if (instRes.success) setInstitutions(instRes.institutions);
      if (stuRes.success) setStudents(stuRes.students);
      if (dupRes.success) setDuplicates(dupRes.alerts);
      if (intakeRes.success) setIntakeData(intakeRes.institutions);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle institution approval status update
  const handleUpdateApproval = async (id: string, status: string) => {
    const res = await api.updateInstitutionStatus(id, status);
    if (res.success) {
      loadAllData();
    }
  };

  // Handle duplicate status update
  const handleUpdateDuplicateStatus = async (id: string, status: string, notes?: string) => {
    const res = await api.updateDuplicateStatus(id, status, notes);
    if (res.success) {
      setSelectedDuplicate(null);
      loadAllData();
    }
  };

  // Export report to CSV using server-generated RFC-4180 endpoint
  const handleExportCSV = (type: string) => {
    const reportType = type === 'institutions' ? 'intake' : type;
    const downloadUrl = api.getReportDownloadUrl(reportType as any);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `eduverify_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredInstitutions = institutions.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      i.aisheCode.toLowerCase().includes(instSearch.toLowerCase()) ||
      i.state.toLowerCase().includes(instSearch.toLowerCase());
    const matchState = instStateFilter === 'ALL' || i.state === instStateFilter;
    return matchSearch && matchState;
  });

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.apaarId.includes(studentSearch) ||
      s.institutionName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchCat = studentCategoryFilter === 'ALL' || s.category === studentCategoryFilter;
    const matchStatus = studentStatusFilter === 'ALL' || s.apaarStatus === studentStatusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const chartData = institutions.map((i) => ({
    name: i.shortName || i.name.slice(0, 12),
    approved: i.approvedIntake,
    enrolled: i.currentEnrolment,
    excess: i.analysis?.excessAdmissions || 0,
  }));

  const uniqueStates = Array.from(new Set(institutions.map((i) => i.state)));

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Council Banner */}
      <div className="bg-sky-950 text-white px-4 sm:px-6 py-6 border-b border-sky-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold mb-1">
              <Building2 className="w-4 h-4" />
              <span>AICTE National Command & Regulatory Console</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Council Executive Dashboard</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprehensive APAAR validation metrics, intake caps auditing, and cross-college duplicate prevention.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => handleExportCSV('students')}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors border border-sky-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>National Roster CSV</span>
            </button>
            <button
              onClick={loadAllData}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold border-t border-sky-900/60 pt-3">
          {[
            { id: 'overview', label: 'Overview & Analytics' },
            { id: 'institutions', label: `Institutions (${institutions.length})` },
            { id: 'students', label: `Student Registry (${students.length})` },
            { id: 'duplicates', label: `Duplicate Alerts (${duplicates.filter((d) => d.status !== 'RESOLVED').length})` },
            { id: 'intake', label: 'Intake Monitoring' },
            { id: 'audit', label: 'Audit Logs' },
            { id: 'reports', label: 'Reports & Exports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-sky-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* =========================================================================
            TAB 1: OVERVIEW & ANALYTICS
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Institutions
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats?.totalInstitutions || institutions.length}
                  </p>
                  <span className="text-xs text-teal-700 font-semibold">
                    {stats?.approvedInstitutions || 5} Approved
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  National Enrolment
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats?.totalStudents || students.length}
                  </p>
                  <span className="text-xs text-slate-500 font-mono">
                    Cap: {stats?.totalApprovedIntake || 485}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Validated APAAR IDs
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-teal-700 tabular-nums">
                    {stats?.validatedApaarCount || students.filter((s) => s.apaarStatus === 'VALID').length}
                  </p>
                  <span className="text-xs text-slate-500">
                    {Math.round(((stats?.validatedApaarCount || 8) / (students.length || 1)) * 100)}% Verified
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Excess Admissions
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-rose-600 tabular-nums">
                    {institutions.filter((i) => i.analysis?.isExceeded).length}
                  </p>
                  <span className="text-xs text-rose-600 font-semibold">Colleges Flagged</span>
                </div>
              </div>
            </div>

            {/* High-Density Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Intake vs Enrolment Chart (2 Cols) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Approved Intake vs. Actual Enrolment (By Institution)
                    </h2>
                    <p className="text-xs text-slate-500">Live comparison against AICTE annual approval caps</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('intake')}
                    className="text-xs font-semibold text-sky-800 hover:text-sky-900"
                  >
                    View All Compliance →
                  </button>
                </div>

                <IntakeComparisonChart data={chartData} />
              </div>

              {/* APAAR Status Donut (1 Col) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">APAAR Validation Breakdown</h2>
                  <p className="text-xs text-slate-500">Verhoeff checksum & duplication audit</p>
                </div>

                <ApaarDistributionDonut
                  stats={{
                    valid: students.filter((s) => s.apaarStatus === 'VALID').length,
                    pending: students.filter((s) => s.apaarStatus === 'PENDING').length,
                    invalid: students.filter((s) => s.apaarStatus === 'INVALID').length,
                    duplicate: students.filter((s) => s.apaarStatus === 'DUPLICATE').length,
                  }}
                />
              </div>
            </div>

            {/* Quick Action Alerts Strip */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">High-Priority Compliance Alerts</h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">Immediate Action Required</span>
              </div>

              <div className="divide-y divide-slate-100">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{dup.reason}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          {dup.similarityScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Candidate registered at <span className="font-semibold text-slate-700">{dup.institutionNameA}</span> and <span className="font-semibold text-slate-700">{dup.institutionNameB}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedDuplicate(dup)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shrink-0"
                    >
                      Audit & Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: INSTITUTIONS MANAGEMENT
           ========================================================================= */}
        {activeTab === 'institutions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                  type="text"
                  placeholder="Search by college name, AISHE code..."
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-sky-800"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">State:</span>
                <select
                  value={instStateFilter}
                  onChange={(e) => setInstStateFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                >
                  <option value="ALL">All States</option>
                  {uniqueStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleExportCSV('institutions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Institutions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Institution Name & AISHE</th>
                    <th className="py-3 px-4">State & Type</th>
                    <th className="py-3 px-4 text-right">Approved Intake</th>
                    <th className="py-3 px-4 text-right">Regular Enrolled</th>
                    <th className="py-3 px-4 text-center">Intake Status</th>
                    <th className="py-3 px-4 text-center">Approval</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInstitutions.map((inst) => {
                    const isExceeded = inst.analysis?.isExceeded;
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{inst.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            AISHE: {inst.aisheCode} · AICTE: {inst.aicteApprovalId}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">{inst.state}</span>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{inst.type}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          {inst.approvedIntake}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isExceeded ? 'text-rose-600 font-black' : 'text-slate-900'}>
                            {inst.analysis?.regularEnrolment || inst.currentEnrolment}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExceeded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                              +{inst.analysis.excessAdmissions} Excess
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800">
                              Compliant ({inst.analysis?.regularUtilizationPercent}%)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inst.approvalStatus === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inst.approvalStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inst.approvalStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {inst.approvalStatus === 'PENDING' ? (
                            <button
                              onClick={() => handleUpdateApproval(inst.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          ) : inst.approvalStatus === 'APPROVED' ? (
                            <button
                              onClick={() => handleUpdateApproval(inst.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateApproval(inst.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-slate-700 text-white rounded text-[11px] font-semibold hover:bg-slate-800"
                            >
                              Re-Activate
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInst(inst)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: NATIONAL STUDENT REGISTRY
           ========================================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, APAAR..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-sky-800"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={studentCategoryFilter}
                  onChange={(e) => setStudentCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="ALL">All Categories</option>
                  <option value="GENERAL">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>

                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="ALL">All APAAR Statuses</option>
                  <option value="VALID">Valid</option>
                  <option value="INVALID">Invalid</option>
                  <option value="DUPLICATE">Duplicate</option>
                </select>

                <button
                  onClick={() => handleExportCSV('students')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-900 text-white text-xs font-semibold rounded hover:bg-sky-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Registry</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Student Particulars</th>
                    <th className="py-3 px-4">Institutional Enrolment</th>
                    <th className="py-3 px-4">Masked APAAR ID</th>
                    <th className="py-3 px-4">Quota / Category</th>
                    <th className="py-3 px-4 text-center">APAAR Checksum</th>
                    <th className="py-3 px-4 text-center">Registry Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          ID: {s.studentId} · DOB: {s.dateOfBirth}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{s.institutionName}</p>
                        <p className="text-[11px] text-slate-500">{s.programmeName}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-900">
                        {s.maskedApaarId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{s.quotaType}</span>
                        <span className="text-[11px] text-slate-500 block">Cat: {s.category}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.apaarChecksumOk ? (
                          <span className="text-teal-700 font-semibold flex items-center justify-center gap-1 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold flex items-center justify-center gap-1 text-[11px]">
                            <AlertOctagon className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: DUPLICATE DETECTION HUB
           ========================================================================= */}
        {activeTab === 'duplicates' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Intelligent Duplicate Detection Hub</h2>
                  <p className="text-xs text-slate-500">
                    Automated conflict resolution protecting national higher education seats against multi-enrolment fraud.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCSV('duplicates')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Duplicates CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {duplicates.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      <span className="font-mono text-xs font-bold text-slate-900">{alert.id}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        APAAR ID: {alert.apaarId.slice(0, 4)}••••{alert.apaarId.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        Confidence Risk: {alert.similarityScore}%
                      </span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Status: {alert.status}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Record A</p>
                      <p className="text-sm font-bold text-slate-900">{alert.studentNameA}</p>
                      <p className="text-xs text-slate-600">{alert.institutionNameA}</p>
                      <p className="text-[11px] font-mono text-slate-500">Student ID: {alert.studentIdA}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conflicting Record B</p>
                      <p className="text-sm font-bold text-slate-900">{alert.studentNameB}</p>
                      <p className="text-xs text-slate-600">{alert.institutionNameB}</p>
                      <p className="text-[11px] font-mono text-slate-500">Student ID: {alert.studentIdB}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                    <span className="font-bold text-amber-900">Detection Reason: </span>
                    {alert.reason}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Detected: {new Date(alert.detectedAt).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateDuplicateStatus(alert.id, 'CONFIRMED_DUPLICATE', 'Confirmed simultaneous active admission by council.')}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Confirm Duplicate
                      </button>
                      <button
                        onClick={() => handleUpdateDuplicateStatus(alert.id, 'RESOLVED', 'Candidate regularized; second admission withdrawn.')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Resolve Alert
                      </button>
                      <button
                        onClick={() => handleUpdateDuplicateStatus(alert.id, 'FALSE_POSITIVE', 'Verified as legitimate concurrent diploma or separate programme.')}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded transition-colors"
                      >
                        Mark False Positive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: INTAKE MONITORING & VIOLATIONS
           ========================================================================= */}
        {activeTab === 'intake' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Intake Compliance & Quota Enforcement</h2>
              <p className="text-xs text-slate-500">
                Audits institutional enrolment against approved AICTE caps and supernumerary categories (NRI / OCI / Foreign National).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {institutions.map((inst) => {
                const analysis = inst.analysis;
                const isExceeded = analysis?.isExceeded;
                return (
                  <div
                    key={inst.id}
                    className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${
                      isExceeded ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{inst.name}</h3>
                          {isExceeded && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                              Violation Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          {inst.state} · AISHE: {inst.aisheCode} · Approval: {inst.aicteApprovalId}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">
                          {analysis?.regularUtilizationPercent}% Utilization
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {analysis?.regularEnrolment} / {analysis?.approvedIntake} Regular Seats
                        </p>
                      </div>
                    </div>

                    {/* Metric Breakdowns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Approved Intake</span>
                        <p className="text-lg font-bold font-mono text-slate-900">{inst.approvedIntake}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Regular Enrolment</span>
                        <p className={`text-lg font-bold font-mono ${isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
                          {analysis?.regularEnrolment}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Excess Over Cap</span>
                        <p className="text-lg font-bold font-mono text-rose-600">
                          {analysis?.excessAdmissions > 0 ? `+${analysis.excessAdmissions}` : '0'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Supernumerary Seats</span>
                        <p className="text-lg font-bold font-mono text-teal-800">
                          {analysis?.supernumeraryEnrolment} / {inst.supernumeraryLimit}
                        </p>
                        <span className="text-[9px] text-slate-400">
                          NRI: {inst.nriEnrolment} · OCI: {inst.ociEnrolment} · FN: {inst.foreignEnrolment}
                        </span>
                      </div>
                    </div>

                    {isExceeded && (
                      <div className="mt-4 p-3 bg-rose-100/80 rounded-lg text-xs text-rose-900 flex items-center justify-between">
                        <span>
                          Regulatory Action: Formal intake violation notice generated. Institution must submit explanation to the Council within 7 working days.
                        </span>
                        <button className="px-3 py-1 bg-rose-800 text-white rounded text-[11px] font-bold shrink-0 ml-3">
                          Issue AICTE Notice
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: AUDIT LOGS
           ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">National Compliance Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Immutable record of student registrations, APAAR verifications, duplicate detections, and approvals.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events Logged</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.userRole}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: REPORTS & EXPORTS
           ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-slate-900">Official AICTE National Regulatory Reports</h2>
              <p className="text-xs text-slate-600">
                Generate and download compliance datasets in CSV and standardized reporting formats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-sky-100 text-sky-800 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Institution-Wise Enrolment Report</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete breakdown of approved intake vs. enrolled regular and supernumerary students by institution.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCSV('institutions')}
                  className="w-full mt-4 px-3 py-2 bg-sky-900 text-white rounded text-xs font-semibold hover:bg-sky-800 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (CSV)</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-teal-100 text-teal-800 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">National Student Registry Report</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    All registered student records including masked APAAR, admission categories, and validation statuses.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCSV('students')}
                  className="w-full mt-4 px-3 py-2 bg-sky-900 text-white rounded text-xs font-semibold hover:bg-sky-800 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (CSV)</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-rose-100 text-rose-800 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Duplicate Conflict Audit Report</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Comprehensive log of all potential and confirmed cross-institutional duplicate enrolments.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCSV('duplicates')}
                  className="w-full mt-4 px-3 py-2 bg-sky-900 text-white rounded text-xs font-semibold hover:bg-sky-800 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Institution Details Modal */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedInst.name}</h3>
                <p className="text-xs text-slate-500 font-mono">AISHE: {selectedInst.aisheCode}</p>
              </div>
              <button onClick={() => setSelectedInst(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p><span className="font-semibold text-slate-800">Address:</span> {selectedInst.address}</p>
              <p><span className="font-semibold text-slate-800">Website:</span> <a href={selectedInst.website} target="_blank" rel="noreferrer" className="text-sky-800 underline">{selectedInst.website}</a></p>
              <p><span className="font-semibold text-slate-800">Contact:</span> {selectedInst.contactEmail} · {selectedInst.contactPhone}</p>
              <p><span className="font-semibold text-slate-800">Approved Intake:</span> {selectedInst.approvedIntake}</p>
              <p><span className="font-semibold text-slate-800">Supernumerary Limit:</span> {selectedInst.supernumeraryLimit}</p>
              <p><span className="font-semibold text-slate-800">Current Regular Enrolment:</span> {selectedInst.analysis?.regularEnrolment}</p>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedInst(null)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
