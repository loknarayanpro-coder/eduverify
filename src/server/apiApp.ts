import express, { Request, Response, NextFunction } from 'express';
import { db } from './database/db.ts';
import { validateApaarStructure, maskApaarId } from './services/apaarValidator.ts';
import { scanForDuplicates, registerDuplicateAlertIfFound } from './services/duplicateEngine.ts';
import { analyzeInstitutionIntake, getAllIntakeAnalyses } from './services/intakeEngine.ts';
import { issueStudentCredential, verifyCredentialByToken } from './services/verificationEngine.ts';
import { Student, UserRole, AdmissionCategory, QuotaType } from './types.ts';

export const apiApp = express();

// Standard middleware
apiApp.use(express.json({ limit: '10mb' }));
apiApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
apiApp.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') && req.method !== 'GET') {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Helper for simulated JWT auth
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer usr-')) {
    const userId = authHeader.replace('Bearer ', '');
    return db.getUserById(userId);
  }
  // Default to Super Admin for demo ease if unauthenticated
  return db.getUsers()[0];
}

/* ==========================================================================
   AUTHENTICATION & DEMO PERSONA SWITCHER
   ========================================================================== */

apiApp.get('/api/auth/demo-users', (_req: Request, res: Response) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    title: u.title,
    institutionId: u.institutionId,
    studentId: u.studentId,
    verifierOrg: u.verifierOrg,
    avatar: u.avatar,
  }));
  res.json({ success: true, users });
});

apiApp.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please use demo credentials or quick persona switcher.' });
  }

  // Demo password check or accept match
  res.json({
    success: true,
    token: user.id,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      title: user.title,
      institutionId: user.institutionId,
      studentId: user.studentId,
      verifierOrg: user.verifierOrg,
      avatar: user.avatar,
    },
  });
});

apiApp.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      title: user.title,
      institutionId: user.institutionId,
      studentId: user.studentId,
      verifierOrg: user.verifierOrg,
      avatar: user.avatar,
    },
  });
});

apiApp.post('/api/auth/switch-persona', (req: Request, res: Response) => {
  const { role, userId } = req.body;
  const users = db.getUsers();
  let selected = userId ? users.find((u) => u.id === userId) : users.find((u) => u.role === role);

  if (!selected) {
    selected = users[0];
  }

  db.addAuditLog({
    userId: selected.id,
    userName: selected.fullName,
    userRole: selected.role,
    action: 'PERSONA_SWITCHED',
    entityType: 'UserSession',
    entityId: selected.id,
    details: `Active role switched to ${selected.role} (${selected.fullName})`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    token: selected.id,
    user: {
      id: selected.id,
      email: selected.email,
      fullName: selected.fullName,
      role: selected.role,
      title: selected.title,
      institutionId: selected.institutionId,
      studentId: selected.studentId,
      verifierOrg: selected.verifierOrg,
      avatar: selected.avatar,
    },
  });
});

/* ==========================================================================
   INSTITUTIONS API
   ========================================================================== */

apiApp.get('/api/institutions', (req: Request, res: Response) => {
  const { search, state, approvalStatus, type } = req.query;
  let list = db.getInstitutions();

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    list = list.filter((i) => i.name.toLowerCase().includes(s) || i.aisheCode.toLowerCase().includes(s) || i.aicteApprovalId.toLowerCase().includes(s));
  }
  if (state && typeof state === 'string') {
    list = list.filter((i) => i.state.toLowerCase() === state.toLowerCase());
  }
  if (approvalStatus && typeof approvalStatus === 'string') {
    list = list.filter((i) => i.approvalStatus === approvalStatus);
  }
  if (type && typeof type === 'string') {
    list = list.filter((i) => i.type === type);
  }

  // Enrich with live intake analysis
  const enriched = list.map((inst) => {
    const analysis = analyzeInstitutionIntake(inst);
    return {
      ...inst,
      analysis,
    };
  });

  res.json({ success: true, institutions: enriched });
});

apiApp.get('/api/institutions/:id', (req: Request, res: Response) => {
  const inst = db.getInstitutionById(req.params.id);
  if (!inst) {
    return res.status(404).json({ success: false, message: 'Institution not found' });
  }
  const analysis = analyzeInstitutionIntake(inst);
  const students = db.getStudents().filter((s) => s.institutionId === inst.id);

  res.json({ success: true, institution: { ...inst, analysis, studentsCount: students.length } });
});

apiApp.post('/api/institutions', (req: Request, res: Response) => {
  const { name, shortName, type, state, district, address, approvedIntake, supernumeraryLimit, establishedYear, website, contactEmail, contactPhone } = req.body;

  if (!name || !state || !approvedIntake) {
    return res.status(400).json({ success: false, message: 'Name, State, and Approved Intake are required.' });
  }

  const newInst = {
    id: `inst-${Date.now()}`,
    aisheCode: `C-${Math.floor(10000 + Math.random() * 90000)}`,
    aicteApprovalId: `1-${Math.floor(100000000 + Math.random() * 900000000)}`,
    name,
    shortName: shortName || name.slice(0, 15),
    type: type || 'ENGINEERING',
    state,
    district: district || 'Central',
    address: address || '',
    approvedIntake: Number(approvedIntake),
    currentEnrolment: 0,
    supernumeraryLimit: Number(supernumeraryLimit) || Math.round(Number(approvedIntake) * 0.15),
    supernumeraryEnrolment: 0,
    nriEnrolment: 0,
    ociEnrolment: 0,
    foreignEnrolment: 0,
    approvalStatus: 'PENDING' as const,
    establishedYear: Number(establishedYear) || 2020,
    website: website || '',
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
  };

  db.addInstitution(newInst);

  db.addAuditLog({
    userId: 'user',
    userName: 'Institution Registrar',
    userRole: 'INSTITUTION_ADMIN',
    action: 'INSTITUTION_REGISTERED',
    entityType: 'Institution',
    entityId: newInst.id,
    details: `New institution application submitted: ${newInst.name}`,
    timestamp: new Date().toISOString(),
  });

  db.addNotification({
    targetRole: 'SUPER_ADMIN',
    title: 'New Institution Registration',
    message: `${newInst.name} (${newInst.state}) has submitted registration documents for AICTE approval.`,
    type: 'INFO',
    link: '/admin/institutions',
  });

  res.status(201).json({ success: true, institution: newInst });
});

apiApp.patch('/api/institutions/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['APPROVED', 'PENDING', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid approval status' });
  }

  const updated = db.updateInstitution(req.params.id, { approvalStatus: status });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Institution not found' });
  }

  db.addAuditLog({
    userId: 'usr-aicte-admin',
    userName: 'Dr. Anil Sahasrabudhe',
    userRole: 'SUPER_ADMIN',
    action: 'INSTITUTION_APPROVAL_UPDATED',
    entityType: 'Institution',
    entityId: updated.id,
    details: `Updated approval status of ${updated.name} to ${status}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, institution: updated });
});

/* ==========================================================================
   STUDENTS API & ENROLMENT
   ========================================================================== */

apiApp.get('/api/students', (req: Request, res: Response) => {
  const { search, institutionId, state, category, quotaType, apaarStatus } = req.query;
  let list = db.getStudents();

  if (institutionId && typeof institutionId === 'string') {
    list = list.filter((s) => s.institutionId === institutionId);
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    list = list.filter(
      (st) =>
        st.fullName.toLowerCase().includes(s) ||
        st.studentId.toLowerCase().includes(s) ||
        st.apaarId.includes(s) ||
        st.email.toLowerCase().includes(s)
    );
  }
  if (state && typeof state === 'string') {
    list = list.filter((st) => st.state.toLowerCase() === state.toLowerCase());
  }
  if (category && typeof category === 'string') {
    list = list.filter((st) => st.category === category);
  }
  if (quotaType && typeof quotaType === 'string') {
    list = list.filter((st) => st.quotaType === quotaType);
  }
  if (apaarStatus && typeof apaarStatus === 'string') {
    list = list.filter((st) => st.apaarStatus === apaarStatus);
  }

  res.json({ success: true, total: list.length, students: list });
});

apiApp.get('/api/students/:id', (req: Request, res: Response) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const credential = db.getCredentialByStudentId(student.studentId);
  res.json({ success: true, student, credential });
});

apiApp.post('/api/students', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const data = req.body;

  if (!data.fullName || !data.studentId || !data.institutionId) {
    return res.status(400).json({ success: false, message: 'Full Name, Student ID, and Institution are required.' });
  }

  // 1. APAAR Validation
  let apaarStatus: Student['apaarStatus'] = 'VALID';
  let isChecksumOk = false;
  if (data.apaarId) {
    const valResult = validateApaarStructure(data.apaarId);
    isChecksumOk = valResult.isChecksumValid;
    apaarStatus = valResult.status;
  } else {
    apaarStatus = 'INVALID';
  }

  const inst = db.getInstitutionById(data.institutionId);
  const instName = inst ? inst.name : 'Unknown Institution';

  const newStudent: Student = {
    id: `stu-${Date.now()}`,
    studentId: data.studentId.trim(),
    apaarId: data.apaarId ? data.apaarId.replace(/\s+/g, '') : '',
    maskedApaarId: maskApaarId(data.apaarId),
    fullName: data.fullName.trim(),
    fatherName: data.fatherName || '',
    motherName: data.motherName || '',
    dateOfBirth: data.dateOfBirth || '2005-01-01',
    gender: data.gender || 'MALE',
    email: data.email || `${data.studentId.toLowerCase()}@student.eduverify.gov.in`,
    mobile: data.mobile || '+91-9000000000',
    address: data.address || '',
    state: data.state || (inst ? inst.state : 'Maharashtra'),
    district: data.district || (inst ? inst.district : 'Pune'),
    nationality: data.nationality || 'Indian',
    category: (data.category as AdmissionCategory) || 'GENERAL',
    quotaType: (data.quotaType as QuotaType) || 'REGULAR',
    institutionId: data.institutionId,
    institutionName: instName,
    programmeId: data.programmeId || 'prog-gen',
    programmeName: data.programmeName || 'B.Tech Engineering',
    academicYear: data.academicYear || '2024-2025',
    admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
    currentStatus: 'ACTIVE',
    apaarStatus,
    apaarValidationDate: new Date().toISOString(),
    apaarChecksumOk: isChecksumOk,
  };

  // 2. Intelligent Duplicate Detection
  const dupAlert = registerDuplicateAlertIfFound(newStudent);
  if (dupAlert) {
    newStudent.apaarStatus = 'DUPLICATE';
  }

  // 3. Save Student
  db.addStudent(newStudent);

  // 4. Issue Verification Credential
  const credential = issueStudentCredential(newStudent);

  // 5. Check Intake Impact
  if (inst) {
    const analysis = analyzeInstitutionIntake(inst);
    if (analysis.isExceeded) {
      db.addNotification({
        targetRole: 'SUPER_ADMIN',
        title: 'Intake Cap Exceeded',
        message: `${inst.name} has exceeded its approved intake (${inst.approvedIntake}) following enrolment of ${newStudent.fullName}. Current: ${analysis.regularEnrolment}`,
        type: 'ERROR',
        link: '/admin/intake',
      });
    }
  }

  // 6. Audit Trail
  db.addAuditLog({
    userId: user?.id || 'usr-coep-admin',
    userName: user?.fullName || 'Registrar',
    userRole: user?.role || 'INSTITUTION_ADMIN',
    action: 'STUDENT_CREATED',
    entityType: 'Student',
    entityId: newStudent.studentId,
    details: `Enrolled student ${newStudent.fullName} (${newStudent.studentId}) with APAAR status: ${newStudent.apaarStatus}`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    student: newStudent,
    credential,
    duplicateAlert: dupAlert,
  });
});

apiApp.put('/api/students/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const updates = req.body;

  if (updates.apaarId) {
    const valResult = validateApaarStructure(updates.apaarId);
    updates.apaarChecksumOk = valResult.isChecksumValid;
    updates.apaarStatus = valResult.status;
    updates.maskedApaarId = maskApaarId(updates.apaarId);
    updates.apaarValidationDate = new Date().toISOString();
  }

  const updated = db.updateStudent(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  db.addAuditLog({
    userId: user?.id || 'system',
    userName: user?.fullName || 'Registrar',
    userRole: user?.role || 'INSTITUTION_ADMIN',
    action: 'STUDENT_UPDATED',
    entityType: 'Student',
    entityId: updated.studentId,
    details: `Updated student record for ${updated.fullName}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, student: updated });
});

apiApp.delete('/api/students/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const success = db.deleteStudent(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  db.addAuditLog({
    userId: user?.id || 'system',
    userName: user?.fullName || 'Registrar',
    userRole: user?.role || 'INSTITUTION_ADMIN',
    action: 'STUDENT_DELETED',
    entityType: 'Student',
    entityId: req.params.id,
    details: `Deleted student record ${req.params.id}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Student record deleted successfully' });
});

/* ==========================================================================
   APAAR VALIDATION SERVICE
   ========================================================================== */

apiApp.post('/api/apaar/validate', (req: Request, res: Response) => {
  const { apaarId } = req.body;
  const result = validateApaarStructure(apaarId);
  res.json({ success: true, result });
});

/* ==========================================================================
   DUPLICATE DETECTION & RESOLUTION
   ========================================================================== */

apiApp.get('/api/duplicates', (req: Request, res: Response) => {
  const alerts = db.getDuplicateAlerts();
  res.json({ success: true, total: alerts.length, alerts });
});

apiApp.patch('/api/duplicates/:id/status', (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const user = getAuthUser(req);

  const updated = db.updateDuplicateAlert(req.params.id, {
    status,
    resolutionNotes: notes,
    resolvedBy: user?.fullName || 'AICTE Super Admin',
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Duplicate alert not found' });
  }

  db.addAuditLog({
    userId: user?.id || 'usr-aicte-admin',
    userName: user?.fullName || 'AICTE Officer',
    userRole: 'SUPER_ADMIN',
    action: 'DUPLICATE_RESOLVED',
    entityType: 'DuplicateAlert',
    entityId: updated.id,
    details: `Updated duplicate alert status to ${status}. Notes: ${notes || 'None'}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, alert: updated });
});

/* ==========================================================================
   INTAKE & ADMISSION MONITORING
   ========================================================================== */

apiApp.get('/api/intake/stats', (_req: Request, res: Response) => {
  const analyses = getAllIntakeAnalyses();
  const totalApproved = analyses.reduce((acc, a) => acc + a.approvedIntake, 0);
  const totalRegular = analyses.reduce((acc, a) => acc + a.regularEnrolment, 0);
  const totalSupernumerary = analyses.reduce((acc, a) => acc + a.supernumeraryEnrolment, 0);
  const totalExcess = analyses.reduce((acc, a) => acc + a.excessAdmissions, 0);
  const exceededCount = analyses.filter((a) => a.isExceeded).length;

  res.json({
    success: true,
    stats: {
      totalApprovedIntake: totalApproved,
      totalRegularEnrolment: totalRegular,
      totalSupernumeraryEnrolment: totalSupernumerary,
      totalExcessAdmissions: totalExcess,
      institutionsExceedingCount: exceededCount,
      overallUtilization: Math.round((totalRegular / (totalApproved || 1)) * 100),
    },
    institutions: analyses,
  });
});

/* ==========================================================================
   BULK UPLOAD SERVICE
   ========================================================================== */

apiApp.post('/api/uploads/students', (req: Request, res: Response) => {
  const { institutionId, fileName, rows } = req.body;
  const user = getAuthUser(req);

  if (!institutionId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, message: 'institutionId and array of student rows are required.' });
  }

  const inst = db.getInstitutionById(institutionId);
  const instName = inst ? inst.name : 'Unknown Institution';

  let successCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  const errors: { row: number; field: string; error: string; rawData: any }[] = [];

  rows.forEach((row: any, index: number) => {
    const rowNum = index + 1;
    if (!row.fullName || !row.studentId) {
      invalidCount++;
      errors.push({ row: rowNum, field: 'name/studentId', error: 'Missing full name or student ID', rawData: row });
      return;
    }

    // Check APAAR validity
    let apaarStatus: Student['apaarStatus'] = 'VALID';
    let isChecksumOk = false;
    if (row.apaarId) {
      const val = validateApaarStructure(row.apaarId);
      apaarStatus = val.status;
      isChecksumOk = val.isChecksumValid;
      if (!val.isValid) {
        invalidCount++;
        errors.push({ row: rowNum, field: 'apaarId', error: val.errors.join(', '), rawData: row });
        return;
      }
    }

    // Check duplicates
    const dupScan = scanForDuplicates({
      apaarId: row.apaarId,
      studentId: row.studentId,
      fullName: row.fullName,
      dateOfBirth: row.dateOfBirth,
      institutionId,
    });

    if (dupScan.hasDuplicate) {
      duplicateCount++;
      errors.push({ row: rowNum, field: 'apaarId', error: dupScan.reason, rawData: row });
      return;
    }

    // Valid record -> add
    const student: Student = {
      id: `stu-${Date.now()}-${index}`,
      studentId: String(row.studentId).trim(),
      apaarId: row.apaarId ? String(row.apaarId).replace(/\s+/g, '') : '',
      maskedApaarId: maskApaarId(row.apaarId),
      fullName: String(row.fullName).trim(),
      fatherName: row.fatherName || '',
      motherName: row.motherName || '',
      dateOfBirth: row.dateOfBirth || '2005-01-01',
      gender: row.gender || 'MALE',
      email: row.email || `${String(row.studentId).toLowerCase()}@student.eduverify.gov.in`,
      mobile: row.mobile || '+91-9000000000',
      address: row.address || '',
      state: row.state || (inst ? inst.state : 'Maharashtra'),
      district: row.district || (inst ? inst.district : 'Pune'),
      nationality: row.nationality || 'Indian',
      category: row.category || 'GENERAL',
      quotaType: row.quotaType || 'REGULAR',
      institutionId,
      institutionName: instName,
      programmeId: row.programmeId || 'prog-gen',
      programmeName: row.programmeName || 'B.Tech Engineering',
      academicYear: row.academicYear || '2024-2025',
      admissionDate: row.admissionDate || new Date().toISOString().split('T')[0],
      currentStatus: 'ACTIVE',
      apaarStatus,
      apaarValidationDate: new Date().toISOString(),
      apaarChecksumOk: isChecksumOk,
    };

    db.addStudent(student);
    issueStudentCredential(student);
    successCount++;
  });

  const record = db.addBulkUpload({
    id: `up-${Date.now()}`,
    institutionId,
    institutionName: instName,
    fileName: fileName || 'bulk_students.csv',
    totalRecords: rows.length,
    successfulImports: successCount,
    invalidRecords: invalidCount,
    duplicateRecords: duplicateCount,
    pendingRecords: 0,
    uploadedAt: new Date().toISOString(),
    errors,
  });

  db.addAuditLog({
    userId: user?.id || 'usr-coep-admin',
    userName: user?.fullName || 'Registrar',
    userRole: user?.role || 'INSTITUTION_ADMIN',
    action: 'BULK_UPLOAD_PROCESSED',
    entityType: 'BulkUpload',
    entityId: record.id,
    details: `Processed upload ${record.fileName}: ${successCount} successful, ${invalidCount} invalid, ${duplicateCount} duplicates.`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    summary: {
      total: rows.length,
      imported: successCount,
      invalid: invalidCount,
      duplicates: duplicateCount,
    },
    record,
  });
});

apiApp.get('/api/uploads', (req: Request, res: Response) => {
  const { institutionId } = req.query;
  let uploads = db.getBulkUploads();
  if (institutionId && typeof institutionId === 'string') {
    uploads = uploads.filter((u) => u.institutionId === institutionId);
  }
  res.json({ success: true, uploads });
});

/* ==========================================================================
   VERIFICATION ENGINE & QR VERIFY
   ========================================================================== */

apiApp.post('/api/verification/verify', (req: Request, res: Response) => {
  const { token, verifierOrg, verifierName, purpose } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Verification token or credential ID is required.' });
  }

  const result = verifyCredentialByToken(
    token.trim(),
    verifierOrg || 'Public Authorized Verifier',
    verifierName || 'Screening Agent',
    purpose || 'Academic Record Authenticity Verification'
  );

  res.json({ success: result.verified, ...result });
});

apiApp.get('/api/verification/logs', (_req: Request, res: Response) => {
  const logs = db.getVerificationLogs();
  res.json({ success: true, total: logs.length, logs });
});

/* ==========================================================================
   ANALYTICS & EXECUTIVE METRICS
   ========================================================================== */

apiApp.get('/api/analytics/admin', (_req: Request, res: Response) => {
  const institutions = db.getInstitutions();
  const students = db.getStudents();
  const duplicates = db.getDuplicateAlerts();
  const intakeAnalyses = getAllIntakeAnalyses();

  const totalApprovedIntake = institutions.reduce((a, b) => a + b.approvedIntake, 0);
  const totalEnrolment = students.length;
  const validatedApaarCount = students.filter((s) => s.apaarStatus === 'VALID').length;
  const pendingApaarCount = students.filter((s) => s.apaarStatus === 'PENDING').length;
  const invalidApaarCount = students.filter((s) => s.apaarStatus === 'INVALID' || s.apaarStatus === 'FAILED').length;
  const institutionsExceeding = intakeAnalyses.filter((a) => a.isExceeded).length;

  // State distribution
  const stateMap: Record<string, number> = {};
  students.forEach((s) => {
    stateMap[s.state] = (stateMap[s.state] || 0) + 1;
  });
  const stateDistribution = Object.keys(stateMap).map((k) => ({ state: k, count: stateMap[k] }));

  // Category distribution
  const categoryMap: Record<string, number> = {};
  students.forEach((s) => {
    categoryMap[s.category] = (categoryMap[s.category] || 0) + 1;
  });
  const categoryDistribution = Object.keys(categoryMap).map((k) => ({ category: k, count: categoryMap[k] }));

  // Quota breakdown
  const quotaMap: Record<string, number> = {};
  students.forEach((s) => {
    quotaMap[s.quotaType] = (quotaMap[s.quotaType] || 0) + 1;
  });
  const quotaDistribution = Object.keys(quotaMap).map((k) => ({ quota: k, count: quotaMap[k] }));

  res.json({
    success: true,
    stats: {
      totalInstitutions: institutions.length,
      approvedInstitutions: institutions.filter((i) => i.approvalStatus === 'APPROVED').length,
      totalStudents: totalEnrolment,
      totalApprovedIntake,
      validatedApaarCount,
      pendingApaarCount,
      invalidApaarCount,
      duplicateCount: duplicates.length,
      institutionsExceedingIntake: institutionsExceeding,
      regularUtilizationPercent: Math.round((totalEnrolment / (totalApprovedIntake || 1)) * 100),
    },
    stateDistribution,
    categoryDistribution,
    quotaDistribution,
    recentInstitutions: institutions.slice(0, 5),
    recentDuplicates: duplicates.slice(0, 5),
  });
});

/* ==========================================================================
   REPORTS & AUDIT LOGS
   ========================================================================== */

apiApp.get('/api/audit', (_req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, logs });
});

apiApp.get('/api/notifications', (req: Request, res: Response) => {
  const { role, userId } = req.query;
  const notifs = db.getNotifications(role as string, userId as string);
  res.json({ success: true, notifications: notifs });
});

apiApp.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

apiApp.post('/api/system/reset', (_req: Request, res: Response) => {
  db.resetToDefault();
  res.json({ success: true, message: 'Database reset to default synthetic Indian education state.' });
});
