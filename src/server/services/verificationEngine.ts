import crypto from 'crypto';
import { VerificationCredential, Student, VerificationLog } from '../types.ts';
import { db } from '../database/db.ts';
import { maskApaarId } from './apaarValidator.ts';

const SECRET_KEY = 'eduverify_secure_aicte_secret_2025';

export function generateCredentialToken(studentId: string, institutionId: string): string {
  const payload = `${studentId}:${institutionId}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return `tok_sig_${hmac.slice(0, 24)}`;
}

export function issueStudentCredential(student: Student): VerificationCredential {
  // Check if credential already exists
  const existing = db.getCredentialByStudentId(student.studentId);
  if (existing) return existing;

  const token = generateCredentialToken(student.studentId, student.institutionId);
  const cred: VerificationCredential = {
    id: `cred-${Date.now()}`,
    credentialId: `EDUVERIFY-${student.academicYear.split('-')[0]}-${student.studentId.replace(/[^a-zA-Z0-9]/g, '')}`,
    token,
    studentId: student.studentId,
    studentName: student.fullName,
    maskedApaar: maskApaarId(student.apaarId),
    institutionId: student.institutionId,
    institutionName: student.institutionName,
    programmeName: student.programmeName,
    academicYear: student.academicYear,
    admissionDate: student.admissionDate,
    issueDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    verificationCount: 0,
  };

  db.addCredential(cred);
  return cred;
}

export interface VerificationLookupResult {
  verified: boolean;
  message: string;
  credential?: {
    credentialId: string;
    studentName: string;
    studentId: string;
    maskedApaar: string;
    institutionName: string;
    institutionState: string;
    programmeName: string;
    academicYear: string;
    admissionDate: string;
    issueDate: string;
    status: string;
    verificationCount: number;
    lastVerifiedAt?: string;
    officialAicteApproved: boolean;
    verificationTimestamp: string;
  };
}

export function verifyCredentialByToken(
  tokenOrId: string,
  verifierOrg: string = 'Public Verifier',
  verifierName: string = 'Authorized Agent',
  purpose: string = 'Academic Authenticity Check'
): VerificationLookupResult {
  const cred = db.getCredentialByToken(tokenOrId);

  if (!cred) {
    return {
      verified: false,
      message: 'Credential record not found or digital signature is invalid.',
    };
  }

  const inst = db.getInstitutionById(cred.institutionId);
  const now = new Date().toISOString();

  // Record verification log
  const log: VerificationLog = {
    id: `vlog-${Date.now()}`,
    credentialId: cred.credentialId,
    studentId: cred.studentId,
    studentName: cred.studentName,
    verifierOrg,
    verifierName,
    purpose,
    verifiedAt: now,
    outcome: cred.status === 'ACTIVE' ? 'SUCCESS' : 'REVOKED',
  };
  db.recordVerification(log);

  if (cred.status !== 'ACTIVE') {
    return {
      verified: false,
      message: 'Credential has been revoked or suspended by the issuing institution or AICTE.',
    };
  }

  return {
    verified: true,
    message: 'Official AICTE academic credential verified successfully.',
    credential: {
      credentialId: cred.credentialId,
      studentName: cred.studentName,
      studentId: cred.studentId,
      maskedApaar: cred.maskedApaar,
      institutionName: cred.institutionName,
      institutionState: inst ? inst.state : 'India',
      programmeName: cred.programmeName,
      academicYear: cred.academicYear,
      admissionDate: cred.admissionDate,
      issueDate: cred.issueDate,
      status: cred.status,
      verificationCount: cred.verificationCount,
      lastVerifiedAt: now,
      officialAicteApproved: inst?.approvalStatus === 'APPROVED',
      verificationTimestamp: now,
    },
  };
}
