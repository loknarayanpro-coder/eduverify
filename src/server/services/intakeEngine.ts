import { Institution } from '../types.ts';
import { db } from '../database/db.ts';

export interface IntakeAnalysis {
  institutionId: string;
  institutionName: string;
  approvedIntake: number;
  regularEnrolment: number;
  supernumeraryLimit: number;
  supernumeraryEnrolment: number;
  nriEnrolment: number;
  ociEnrolment: number;
  foreignEnrolment: number;
  regularUtilizationPercent: number;
  excessAdmissions: number;
  remainingSeats: number;
  isExceeded: boolean;
  status: 'COMPLIANT' | 'NEAR_CAPACITY' | 'EXCEEDED';
  supernumeraryViolation: boolean;
}

export function analyzeInstitutionIntake(inst: Institution): IntakeAnalysis {
  const studentRows = db.getStudents().filter((s) => s.institutionId === inst.id && s.currentStatus === 'ACTIVE');
  const regularStudents = studentRows.filter((s) => s.quotaType === 'REGULAR').length;
  const regularCount = Math.max(regularStudents, inst.currentEnrolment);
  const supernumeraryCount = Math.max(
    studentRows.filter((s) => s.quotaType !== 'REGULAR').length,
    inst.supernumeraryEnrolment
  );
  const nriCount = Math.max(studentRows.filter((s) => s.quotaType === 'NRI').length, inst.nriEnrolment);
  const ociCount = Math.max(studentRows.filter((s) => s.quotaType === 'OCI').length, inst.ociEnrolment);
  const foreignCount = Math.max(studentRows.filter((s) => s.quotaType === 'FOREIGN_NATIONAL').length, inst.foreignEnrolment);

  const approved = inst.approvedIntake || 1;
  const utilization = Math.round((regularCount / approved) * 100);
  const excess = Math.max(0, regularCount - approved);
  const remaining = Math.max(0, approved - regularCount);
  const isExceeded = excess > 0;
  const supernumeraryViolation = supernumeraryCount > inst.supernumeraryLimit;

  let status: 'COMPLIANT' | 'NEAR_CAPACITY' | 'EXCEEDED' = 'COMPLIANT';
  if (isExceeded) {
    status = 'EXCEEDED';
  } else if (utilization >= 95) {
    status = 'NEAR_CAPACITY';
  }

  return {
    institutionId: inst.id,
    institutionName: inst.name,
    approvedIntake: approved,
    regularEnrolment: regularCount,
    supernumeraryLimit: inst.supernumeraryLimit,
    supernumeraryEnrolment: supernumeraryCount,
    nriEnrolment: nriCount,
    ociEnrolment: ociCount,
    foreignEnrolment: foreignCount,
    regularUtilizationPercent: utilization,
    excessAdmissions: excess,
    remainingSeats: remaining,
    isExceeded,
    status,
    supernumeraryViolation,
  };
}

export function getAllIntakeAnalyses(): IntakeAnalysis[] {
  const institutions = db.getInstitutions();
  return institutions.map(analyzeInstitutionIntake);
}
