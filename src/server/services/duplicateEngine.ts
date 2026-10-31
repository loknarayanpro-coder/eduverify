import { Student, DuplicateAlert } from '../types.ts';
import { db } from '../database/db.ts';

function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10); // Match last 10 digits
}

export interface DuplicateScanResult {
  hasDuplicate: boolean;
  score: number;
  reason: string;
  matchedStudent?: Student;
  matchType?: 'EXACT_APAAR' | 'FUZZY_NAME_DOB' | 'PHONE_DOB' | 'PARENT_NAME';
}

export function scanForDuplicates(candidate: Partial<Student>, candidateId?: string): DuplicateScanResult {
  const existingStudents = db.getStudents().filter((s) => s.id !== candidateId && s.studentId !== candidate.studentId);

  // 1. Check Exact APAAR match (highest confidence 98-99%)
  if (candidate.apaarId && candidate.apaarId.trim() !== '') {
    const cleanApaar = candidate.apaarId.replace(/[\s\-]+/g, '');
    if (cleanApaar.length >= 10) {
      const apaarMatch = existingStudents.find((s) => s.apaarId && s.apaarId.replace(/[\s\-]+/g, '') === cleanApaar);

      if (apaarMatch) {
        const isSameInst = apaarMatch.institutionId === candidate.institutionId;
        return {
          hasDuplicate: true,
          score: isSameInst ? 99 : 98,
          matchType: 'EXACT_APAAR',
          reason: isSameInst
            ? `Identical APAAR ID (${candidate.apaarId}) registered for existing student ${apaarMatch.fullName} in the same institution.`
            : `Cross-Institution Conflict: APAAR ID (${candidate.apaarId}) is already actively registered at ${apaarMatch.institutionName} for ${apaarMatch.fullName}.`,
          matchedStudent: apaarMatch,
        };
      }
    }
  }

  // 2. Fuzzy match: Normalized Name + Exact Date of Birth (85-90%)
  if (candidate.fullName && candidate.dateOfBirth) {
    const candidateNormName = normalizeString(candidate.fullName);
    const dobMatch = existingStudents.find((s) => {
      const sNormName = normalizeString(s.fullName);
      const isNameClose =
        sNormName === candidateNormName ||
        (candidateNormName.length > 5 && (sNormName.includes(candidateNormName) || candidateNormName.includes(sNormName)));
      return isNameClose && s.dateOfBirth === candidate.dateOfBirth;
    });

    if (dobMatch) {
      const isSameInst = dobMatch.institutionId === candidate.institutionId;
      return {
        hasDuplicate: true,
        score: isSameInst ? 90 : 88,
        matchType: 'FUZZY_NAME_DOB',
        reason: isSameInst
          ? `Potential Duplicate: Student with matching name (${dobMatch.fullName}) and identical Date of Birth (${dobMatch.dateOfBirth}) found at this institution.`
          : `Cross-Institution Potential Duplicate: Student with matching name (${dobMatch.fullName}) and identical Date of Birth (${dobMatch.dateOfBirth}) found at ${dobMatch.institutionName}.`,
        matchedStudent: dobMatch,
      };
    }
  }

  // 3. Collision: Identical Mobile + Date of Birth (85%)
  if (candidate.mobile && candidate.dateOfBirth) {
    const candPhone = normalizePhone(candidate.mobile);
    if (candPhone.length === 10) {
      const phoneMatch = existingStudents.find(
        (s) => s.mobile && normalizePhone(s.mobile) === candPhone && s.dateOfBirth === candidate.dateOfBirth
      );

      if (phoneMatch) {
        return {
          hasDuplicate: true,
          score: 85,
          matchType: 'PHONE_DOB',
          reason: `High Similarity Alert: Mobile phone (${candidate.mobile}) and Date of Birth (${candidate.dateOfBirth}) match existing student ${phoneMatch.fullName} at ${phoneMatch.institutionName}.`,
          matchedStudent: phoneMatch,
        };
      }
    }
  }

  // 4. Collision: Name + Father Name (80%)
  if (candidate.fullName && candidate.fatherName && candidate.fatherName.trim().length > 3) {
    const candName = normalizeString(candidate.fullName);
    const candFather = normalizeString(candidate.fatherName);
    const parentMatch = existingStudents.find(
      (s) =>
        s.fatherName &&
        normalizeString(s.fatherName) === candFather &&
        (normalizeString(s.fullName) === candName ||
          (candName.length > 5 && normalizeString(s.fullName).includes(candName)))
    );

    if (parentMatch) {
      return {
        hasDuplicate: true,
        score: 80,
        matchType: 'PARENT_NAME',
        reason: `Parent Metadata Match: Student name (${parentMatch.fullName}) and guardian (${parentMatch.fatherName}) match record at ${parentMatch.institutionName}.`,
        matchedStudent: parentMatch,
      };
    }
  }

  return {
    hasDuplicate: false,
    score: 0,
    reason: '',
  };
}

export function registerDuplicateAlertIfFound(student: Student): DuplicateAlert | null {
  const scan = scanForDuplicates(student, student.id);
  if (!scan.hasDuplicate || !scan.matchedStudent) return null;

  const existingAlerts = db.getDuplicateAlerts();
  const alreadyAlerted = existingAlerts.find(
    (a) =>
      ((a.studentIdA === student.studentId && a.studentIdB === scan.matchedStudent!.studentId) ||
        (a.studentIdA === scan.matchedStudent!.studentId && a.studentIdB === student.studentId)) &&
      a.status !== 'RESOLVED' &&
      a.status !== 'FALSE_POSITIVE'
  );

  if (alreadyAlerted) {
    return alreadyAlerted;
  }

  const alert: DuplicateAlert = {
    id: `dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    apaarId: student.apaarId,
    studentIdA: student.studentId,
    studentNameA: student.fullName,
    institutionIdA: student.institutionId,
    institutionNameA: student.institutionName,
    studentIdB: scan.matchedStudent.studentId,
    studentNameB: scan.matchedStudent.fullName,
    institutionIdB: scan.matchedStudent.institutionId,
    institutionNameB: scan.matchedStudent.institutionName,
    similarityScore: scan.score,
    reason: scan.reason,
    status: 'NEW',
    detectedAt: new Date().toISOString(),
  };

  db.addDuplicateAlert(alert);

  // Dispatch alert notification to Super Admin
  db.addNotification({
    targetRole: 'SUPER_ADMIN',
    title: 'Duplicate Admission Detected',
    message: `${alert.reason} (Similarity: ${alert.similarityScore}%)`,
    type: 'WARNING',
    link: '/admin/duplicates',
  });

  return alert;
}
