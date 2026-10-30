export type UserRole = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'STUDENT' | 'VERIFIER';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  institutionId?: string;
  studentId?: string;
  verifierOrg?: string;
  title?: string;
  avatar?: string;
}

export type InstitutionType = 'ENGINEERING' | 'MANAGEMENT' | 'POLYTECHNIC' | 'PHARMACY';
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'SUSPENDED';

export interface Institution {
  id: string;
  aisheCode: string;
  aicteApprovalId: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  state: string;
  district: string;
  address: string;
  approvedIntake: number;
  currentEnrolment: number;
  supernumeraryLimit: number;
  supernumeraryEnrolment: number;
  nriEnrolment: number;
  ociEnrolment: number;
  foreignEnrolment: number;
  approvalStatus: ApprovalStatus;
  establishedYear: number;
  website: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Programme {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  degreeLevel: 'UG' | 'PG' | 'DIPLOMA';
  approvedIntake: number;
  currentEnrolment: number;
  supernumeraryQuota: number;
  durationYears: number;
}

export type AdmissionCategory = 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type QuotaType = 'REGULAR' | 'NRI' | 'OCI' | 'FOREIGN_NATIONAL' | 'SUPERNUMERARY';
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN' | 'SUSPENDED';
export type ApaarValidationStatus = 'VALID' | 'PENDING' | 'INVALID' | 'DUPLICATE' | 'FAILED' | 'REQUIRES_REVIEW';

export interface Student {
  id: string;
  studentId: string;
  apaarId: string; // 12-digit APAAR ID
  maskedApaarId: string; // e.g. "•••• •••• 4821"
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  email: string;
  mobile: string;
  address: string;
  state: string;
  district: string;
  nationality: string;
  category: AdmissionCategory;
  quotaType: QuotaType;
  institutionId: string;
  institutionName: string;
  programmeId: string;
  programmeName: string;
  academicYear: string;
  admissionDate: string;
  currentStatus: StudentStatus;
  apaarStatus: ApaarValidationStatus;
  apaarValidationDate?: string;
  apaarChecksumOk: boolean;
  photoUrl?: string;
}

export interface APAARValidationRecord {
  id: string;
  studentId: string;
  apaarId: string;
  status: ApaarValidationStatus;
  validationCode: string;
  checksumAlgorithm: string;
  errors: string[];
  verifiedAt: string;
  adapterType: 'SANDBOX_ADAPTER' | 'GOV_GATEWAY_SIMULATOR';
}

export type DuplicateStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED_DUPLICATE' | 'FALSE_POSITIVE' | 'RESOLVED';

export interface DuplicateAlert {
  id: string;
  apaarId: string;
  studentIdA: string;
  studentNameA: string;
  institutionIdA: string;
  institutionNameA: string;
  studentIdB: string;
  studentNameB: string;
  institutionIdB: string;
  institutionNameB: string;
  similarityScore: number; // 0 - 100
  reason: string;
  status: DuplicateStatus;
  detectedAt: string;
  resolutionNotes?: string;
  resolvedBy?: string;
}

export interface VerificationCredential {
  id: string;
  credentialId: string;
  token: string;
  studentId: string;
  studentName: string;
  maskedApaar: string;
  institutionId: string;
  institutionName: string;
  programmeName: string;
  academicYear: string;
  admissionDate: string;
  issueDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'REVOKED';
  verificationCount: number;
  lastVerifiedAt?: string;
}

export interface VerificationLog {
  id: string;
  credentialId: string;
  studentId: string;
  studentName: string;
  verifierOrg: string;
  verifierName: string;
  purpose: string;
  verifiedAt: string;
  outcome: 'SUCCESS' | 'REVOKED' | 'INVALID_TOKEN';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Notification {
  id: string;
  targetRole?: UserRole | 'ALL';
  targetUserId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface BulkUploadRecord {
  id: string;
  institutionId: string;
  institutionName: string;
  fileName: string;
  totalRecords: number;
  successfulImports: number;
  invalidRecords: number;
  duplicateRecords: number;
  pendingRecords: number;
  uploadedAt: string;
  errors: { row: number; field: string; error: string; rawData?: Record<string, any> }[];
}
