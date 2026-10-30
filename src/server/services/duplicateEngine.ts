import { Student, DuplicateAlert } from '../types.ts';
import { db } from '../database/db.ts';

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface DuplicateScanResult {
  hasDuplicate: boolean;
  score: number;
  reason: string;
  matchedStudent?: Student;
}

export function scanForDuplicates(candidate: Partial<Student>, candidateId?: string): DuplicateScanResult {
  const existingStudents = db.getStudents().filter((s) => s.id !== candidateId && s.studentId !== candidate.studentId);

  // 1. Check Exact APAAR match (highest confidence)
  if (candidate.apaarId && candidate.apaarId.trim() !== '') {
    const cleanApaar = candidate.apaarId.replace(/\s+/g, '');
    const apaarMatch = existingStudents.find((s) => s.apaarId && s.apaarId.replace(/\s+/g, '') === cleanApaar);

    if (apaarMatch) {
      const isSameInst = apaarMatch.institutionId === candidate.institutionId;
      return {
        hasDuplicate: true,
        score: isSameInst ? 99 : 98,
        reason: isSameInst
          ? `Identical APAAR ID (${candidate.apaarId}) registered for existing student ${apaarMatch.fullName} in the same institution.`
          : `Cross-Institution Conflict: APAAR ID (${candidate.apaarId}) is already actively registered at ${apaarMatch.institutionName} for ${apaarMatch.fullName}.`,
        matchedStudent: apaarMatch,
      };
    }
  }

  // 2. Fuzzy match: Normalized Name + Exact Date of Birth
  if (candidate.fullName && candidate.dateOfBirth) {
    const candidateNormName = normalizeString(candidate.fullName);
    const dobMatch = existingStudents.find((s) => {
      const sNormName = normalizeString(s.fullName);
      const isNameClose = sNormName === candidateNormName || (candidateNormName.length > 5 && (sNormName.includes(candidateNormName) || candidateNormName.includes(sNormName)));
      return isNameClose && s.dateOfBirth === candidate.dateOfBirth;
    });

    if (dobMatch) {
      return {
        hasDuplicate: true,
        score: 85,
        reason: `Potential Duplicate: Student with matching name (${dobMatch.fullName}) and identical Date of Birth (${dobMatch.dateOfBirth}) found at ${dobMatch.institutionName}.`,
        matchedStudent: dobMatch,
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
