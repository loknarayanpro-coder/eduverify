import fs from 'fs';
import path from 'path';
import {
  User,
  Institution,
  Programme,
  Student,
  DuplicateAlert,
  VerificationCredential,
  VerificationLog,
  AuditLog,
  Notification,
  BulkUploadRecord,
} from '../types.js';
import {
  validateApaarStructure,
  maskApaarId,
  generateVerhoeffCheckDigit,
} from '../services/apaarValidator.ts';

interface DatabaseSchema {
  users: User[];
  institutions: Institution[];
  programmes: Programme[];
  students: Student[];
  duplicateAlerts: DuplicateAlert[];
  credentials: VerificationCredential[];
  verificationLogs: VerificationLog[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  bulkUploads: BulkUploadRecord[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'eduverify_data.json');

// Helper to generate a valid 12-digit APAAR with correct Verhoeff check digit
function makeValidApaar(elevenDigits: string): string {
  const check = generateVerhoeffCheckDigit(elevenDigits);
  return `${elevenDigits}${check}`;
}

function getInitialData(): DatabaseSchema {
  const inst1Id = 'inst-coep-pune';
  const inst2Id = 'inst-iit-delhi';
  const inst3Id = 'inst-anna-univ';
  const inst4Id = 'inst-vjti-mumbai';
  const inst5Id = 'inst-gec-thrissur';
  const inst6Id = 'inst-bit-bangalore';

  const institutions: Institution[] = [
    {
      id: inst1Id,
      aisheCode: 'C-41584',
      aicteApprovalId: '1-432890112',
      name: 'COEP Technological University',
      shortName: 'COEP Pune',
      type: 'ENGINEERING',
      state: 'Maharashtra',
      district: 'Pune',
      address: 'Wellesley Road, Shivajinagar, Pune, Maharashtra 411005',
      approvedIntake: 60,
      currentEnrolment: 65, // EXCEEDS APPROVED INTAKE! (Violation test case)
      supernumeraryLimit: 12,
      supernumeraryEnrolment: 8,
      nriEnrolment: 3,
      ociEnrolment: 2,
      foreignEnrolment: 3,
      approvalStatus: 'APPROVED',
      establishedYear: 1854,
      website: 'https://www.coep.org.in',
      contactEmail: 'admissions@coep.ac.in',
      contactPhone: '+91-20-25507000',
    },
    {
      id: inst2Id,
      aisheCode: 'U-0109',
      aicteApprovalId: '1-109845321',
      name: 'Indian Institute of Technology Delhi',
      shortName: 'IIT Delhi',
      type: 'ENGINEERING',
      state: 'Delhi',
      district: 'New Delhi',
      address: 'Hauz Khas, New Delhi 110016',
      approvedIntake: 120,
      currentEnrolment: 114,
      supernumeraryLimit: 20,
      supernumeraryEnrolment: 14,
      nriEnrolment: 6,
      ociEnrolment: 4,
      foreignEnrolment: 4,
      approvalStatus: 'APPROVED',
      establishedYear: 1961,
      website: 'https://home.iitd.ac.in',
      contactEmail: 'registrar@admin.iitd.ac.in',
      contactPhone: '+91-11-26591000',
    },
    {
      id: inst3Id,
      aisheCode: 'U-0442',
      aicteApprovalId: '1-874523910',
      name: 'Anna University, College of Engineering Guindy',
      shortName: 'Anna Univ CEG',
      type: 'ENGINEERING',
      state: 'Tamil Nadu',
      district: 'Chennai',
      address: '12, Sardar Patel Rd, Guindy, Chennai, Tamil Nadu 600025',
      approvedIntake: 90,
      currentEnrolment: 88,
      supernumeraryLimit: 15,
      supernumeraryEnrolment: 9,
      nriEnrolment: 4,
      ociEnrolment: 2,
      foreignEnrolment: 3,
      approvalStatus: 'APPROVED',
      establishedYear: 1794,
      website: 'https://www.annauniv.edu',
      contactEmail: 'admissions@annauniv.edu',
      contactPhone: '+91-44-22357004',
    },
    {
      id: inst4Id,
      aisheCode: 'C-34125',
      aicteApprovalId: '1-334215789',
      name: 'Veermata Jijabai Technological Institute',
      shortName: 'VJTI Mumbai',
      type: 'ENGINEERING',
      state: 'Maharashtra',
      district: 'Mumbai City',
      address: 'H R Mahajani Rd, Matunga, Mumbai, Maharashtra 400019',
      approvedIntake: 75,
      currentEnrolment: 72,
      supernumeraryLimit: 10,
      supernumeraryEnrolment: 5,
      nriEnrolment: 2,
      ociEnrolment: 1,
      foreignEnrolment: 2,
      approvalStatus: 'APPROVED',
      establishedYear: 1887,
      website: 'https://www.vjti.ac.in',
      contactEmail: 'director@vjti.ac.in',
      contactPhone: '+91-22-24198100',
    },
    {
      id: inst5Id,
      aisheCode: 'C-23901',
      aicteApprovalId: '1-561920384',
      name: 'Government Engineering College Thrissur',
      shortName: 'GEC Thrissur',
      type: 'ENGINEERING',
      state: 'Kerala',
      district: 'Thrissur',
      address: 'Engineering College PO, Ramavarmapuram, Thrissur, Kerala 680009',
      approvedIntake: 60,
      currentEnrolment: 58,
      supernumeraryLimit: 8,
      supernumeraryEnrolment: 4,
      nriEnrolment: 2,
      ociEnrolment: 0,
      foreignEnrolment: 2,
      approvalStatus: 'APPROVED',
      establishedYear: 1957,
      website: 'https://gectcr.ac.in',
      contactEmail: 'principal@gectcr.ac.in',
      contactPhone: '+91-487-2334144',
    },
    {
      id: inst6Id,
      aisheCode: 'C-12984',
      aicteApprovalId: '1-998124019',
      name: 'Bangalore Institute of Technology',
      shortName: 'BIT Bangalore',
      type: 'ENGINEERING',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      address: 'KR Rd, Parvathipuram, Vishweshwarapura, Bengaluru, Karnataka 560004',
      approvedIntake: 80,
      currentEnrolment: 79,
      supernumeraryLimit: 12,
      supernumeraryEnrolment: 7,
      nriEnrolment: 3,
      ociEnrolment: 2,
      foreignEnrolment: 2,
      approvalStatus: 'PENDING',
      establishedYear: 1979,
      website: 'https://bit-bangalore.edu.in',
      contactEmail: 'principal@bit-bangalore.edu.in',
      contactPhone: '+91-80-26615865',
    },
  ];

  const programmes: Programme[] = [
    {
      id: 'prog-coep-cse',
      institutionId: inst1Id,
      name: 'B.Tech in Computer Engineering',
      code: 'BTECH-CSE',
      degreeLevel: 'UG',
      approvedIntake: 60,
      currentEnrolment: 65,
      supernumeraryQuota: 12,
      durationYears: 4,
    },
    {
      id: 'prog-iitd-cse',
      institutionId: inst2Id,
      name: 'B.Tech in Computer Science and Engineering',
      code: 'IITD-CSE',
      degreeLevel: 'UG',
      approvedIntake: 80,
      currentEnrolment: 78,
      supernumeraryQuota: 15,
      durationYears: 4,
    },
    {
      id: 'prog-anna-ece',
      institutionId: inst3Id,
      name: 'B.E. in Electronics & Communication Engineering',
      code: 'BE-ECE',
      degreeLevel: 'UG',
      approvedIntake: 90,
      currentEnrolment: 88,
      supernumeraryQuota: 15,
      durationYears: 4,
    },
    {
      id: 'prog-vjti-it',
      institutionId: inst4Id,
      name: 'B.Tech in Information Technology',
      code: 'BTECH-IT',
      degreeLevel: 'UG',
      approvedIntake: 75,
      currentEnrolment: 72,
      supernumeraryQuota: 10,
      durationYears: 4,
    },
  ];

  // Generate valid APAAR IDs using Verhoeff check digits
  const validApaar1 = makeValidApaar('98432109845');
  const validApaar2 = makeValidApaar('87210943821');
  const validApaar3 = makeValidApaar('76123498102');
  const validApaar4 = makeValidApaar('65432178901');
  const validApaar5 = makeValidApaar('54321098765');
  const validApaar6 = makeValidApaar('43210987654');
  const validApaar7 = makeValidApaar('32109876543');
  const validApaar8 = makeValidApaar('21098765432');
  // Duplicate APAAR used for cross-institution alert test case:
  const crossDupApaar = makeValidApaar('91827364501');

  const students: Student[] = [
    {
      id: 'stu-001',
      studentId: 'COEP-2024-CSE-001',
      apaarId: validApaar1,
      maskedApaarId: maskApaarId(validApaar1),
      fullName: 'Aarav Sharma',
      fatherName: 'Suresh Sharma',
      motherName: 'Sunita Sharma',
      dateOfBirth: '2005-04-18',
      gender: 'MALE',
      email: 'aarav.sharma@student.eduverify.gov.in',
      mobile: '+91-9876543210',
      address: 'Plot 42, Model Colony, Pune',
      state: 'Maharashtra',
      district: 'Pune',
      nationality: 'Indian',
      category: 'GENERAL',
      quotaType: 'REGULAR',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-15',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-16T10:30:00Z',
      apaarChecksumOk: true,
    },
    {
      id: 'stu-002',
      studentId: 'COEP-2024-CSE-002',
      apaarId: validApaar2,
      maskedApaarId: maskApaarId(validApaar2),
      fullName: 'Ananya Iyer',
      fatherName: 'Venkatesh Iyer',
      motherName: 'Lakshmi Iyer',
      dateOfBirth: '2005-08-22',
      gender: 'FEMALE',
      email: 'ananya.iyer@student.eduverify.gov.in',
      mobile: '+91-9823019283',
      address: 'Flat 301, Royal Palms, Aundh, Pune',
      state: 'Maharashtra',
      district: 'Pune',
      nationality: 'Indian',
      category: 'OBC',
      quotaType: 'REGULAR',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-15',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-16T11:00:00Z',
      apaarChecksumOk: true,
    },
    {
      // TEST CASE: NRI Supernumerary Category
      id: 'stu-003',
      studentId: 'COEP-2024-CSE-003',
      apaarId: validApaar3,
      maskedApaarId: maskApaarId(validApaar3),
      fullName: 'Rohan Mehta',
      fatherName: 'Kishore Mehta',
      motherName: 'Reena Mehta',
      dateOfBirth: '2004-11-09',
      gender: 'MALE',
      email: 'rohan.mehta@student.eduverify.gov.in',
      mobile: '+91-9811223344',
      address: 'Al-Barsha Tower 4, Dubai, UAE (Local: Kalyani Nagar, Pune)',
      state: 'Maharashtra',
      district: 'Pune',
      nationality: 'Indian (NRI)',
      category: 'GENERAL',
      quotaType: 'NRI',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-18',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-19T09:15:00Z',
      apaarChecksumOk: true,
    },
    {
      // TEST CASE: Missing APAAR ID
      id: 'stu-004',
      studentId: 'COEP-2024-CSE-004',
      apaarId: '',
      maskedApaarId: '•••• •••• ••••',
      fullName: 'Vikramaditya Rathore',
      fatherName: 'Raghavendra Rathore',
      motherName: 'Devika Rathore',
      dateOfBirth: '2005-02-14',
      gender: 'MALE',
      email: 'vikram.rathore@student.eduverify.gov.in',
      mobile: '+91-9765432109',
      address: 'Civil Lines, Jaipur, Rajasthan',
      state: 'Rajasthan',
      district: 'Jaipur',
      nationality: 'Indian',
      category: 'EWS',
      quotaType: 'REGULAR',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-20',
      currentStatus: 'ACTIVE',
      apaarStatus: 'INVALID',
      apaarValidationDate: '2024-07-21T14:20:00Z',
      apaarChecksumOk: false,
    },
    {
      // TEST CASE: Invalid Checksum / Malformed APAAR ID
      id: 'stu-005',
      studentId: 'COEP-2024-CSE-005',
      apaarId: '984321098450', // Wrong check digit intentionally
      maskedApaarId: '•••• •••• 8450',
      fullName: 'Pooja Hegde',
      fatherName: 'Naveen Hegde',
      motherName: 'Usha Hegde',
      dateOfBirth: '2005-06-30',
      gender: 'FEMALE',
      email: 'pooja.hegde@student.eduverify.gov.in',
      mobile: '+91-9845123456',
      address: 'Jayanagar 4th Block, Bengaluru',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      nationality: 'Indian',
      category: 'OBC',
      quotaType: 'REGULAR',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-20',
      currentStatus: 'ACTIVE',
      apaarStatus: 'INVALID',
      apaarValidationDate: '2024-07-21T15:00:00Z',
      apaarChecksumOk: false,
    },
    {
      // TEST CASE: Cross-Institution Duplicate Enrolment Student A (COEP Pune)
      id: 'stu-006',
      studentId: 'COEP-2024-CSE-006',
      apaarId: crossDupApaar,
      maskedApaarId: maskApaarId(crossDupApaar),
      fullName: 'Tanvi Rajesh Kulkarni',
      fatherName: 'Rajesh Kulkarni',
      motherName: 'Meera Kulkarni',
      dateOfBirth: '2005-09-12',
      gender: 'FEMALE',
      email: 'tanvi.kulkarni@coep.ac.in',
      mobile: '+91-9822114455',
      address: 'Kothrud, Pune, Maharashtra',
      state: 'Maharashtra',
      district: 'Pune',
      nationality: 'Indian',
      category: 'GENERAL',
      quotaType: 'REGULAR',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeId: 'prog-coep-cse',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-22',
      currentStatus: 'ACTIVE',
      apaarStatus: 'DUPLICATE',
      apaarValidationDate: '2024-07-23T12:00:00Z',
      apaarChecksumOk: true,
    },
    {
      // TEST CASE: Cross-Institution Duplicate Enrolment Student B (IIT Delhi)
      id: 'stu-007',
      studentId: 'IITD-2024-CSE-042',
      apaarId: crossDupApaar, // IDENTICAL APAAR ID!
      maskedApaarId: maskApaarId(crossDupApaar),
      fullName: 'Tanvi R Kulkarni',
      fatherName: 'Rajesh Kulkarni',
      motherName: 'Meera Kulkarni',
      dateOfBirth: '2005-09-12',
      gender: 'FEMALE',
      email: 'tanvi.k@iitd.ac.in',
      mobile: '+91-9822114455',
      address: 'Kailash Hostel, IIT Delhi Campus, New Delhi',
      state: 'Delhi',
      district: 'New Delhi',
      nationality: 'Indian',
      category: 'GENERAL',
      quotaType: 'REGULAR',
      institutionId: inst2Id,
      institutionName: 'Indian Institute of Technology Delhi',
      programmeId: 'prog-iitd-cse',
      programmeName: 'B.Tech in Computer Science and Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-28',
      currentStatus: 'ACTIVE',
      apaarStatus: 'DUPLICATE',
      apaarValidationDate: '2024-07-29T10:00:00Z',
      apaarChecksumOk: true,
    },
    {
      id: 'stu-008',
      studentId: 'IITD-2024-CSE-001',
      apaarId: validApaar4,
      maskedApaarId: maskApaarId(validApaar4),
      fullName: 'Aditya Sen',
      fatherName: 'Subir Sen',
      motherName: 'Mousumi Sen',
      dateOfBirth: '2004-12-05',
      gender: 'MALE',
      email: 'aditya.sen@iitd.ac.in',
      mobile: '+91-9433123456',
      address: 'Salt Lake City, Kolkata, West Bengal',
      state: 'West Bengal',
      district: 'Kolkata',
      nationality: 'Indian',
      category: 'GENERAL',
      quotaType: 'REGULAR',
      institutionId: inst2Id,
      institutionName: 'Indian Institute of Technology Delhi',
      programmeId: 'prog-iitd-cse',
      programmeName: 'B.Tech in Computer Science and Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-15',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-16T10:00:00Z',
      apaarChecksumOk: true,
    },
    {
      id: 'stu-009',
      studentId: 'ANNA-2024-ECE-012',
      apaarId: validApaar5,
      maskedApaarId: maskApaarId(validApaar5),
      fullName: 'Karthik Subramanian',
      fatherName: 'Subramanian R',
      motherName: 'Kalyani S',
      dateOfBirth: '2005-03-27',
      gender: 'MALE',
      email: 'karthik.s@annauniv.edu',
      mobile: '+91-9444123456',
      address: 'Mylapore, Chennai, Tamil Nadu',
      state: 'Tamil Nadu',
      district: 'Chennai',
      nationality: 'Indian',
      category: 'SC',
      quotaType: 'REGULAR',
      institutionId: inst3Id,
      institutionName: 'Anna University, College of Engineering Guindy',
      programmeId: 'prog-anna-ece',
      programmeName: 'B.E. in Electronics & Communication Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-17',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-18T11:20:00Z',
      apaarChecksumOk: true,
    },
    {
      // TEST CASE: Foreign National Admission Category
      id: 'stu-010',
      studentId: 'ANNA-2024-ECE-013',
      apaarId: validApaar6,
      maskedApaarId: maskApaarId(validApaar6),
      fullName: 'Thabo Ndlovu',
      fatherName: 'Mandla Ndlovu',
      motherName: 'Nandi Ndlovu',
      dateOfBirth: '2004-05-19',
      gender: 'MALE',
      email: 'thabo.ndlovu@annauniv.edu',
      mobile: '+91-9123456789',
      address: 'International Student Hostel, Anna University, Chennai',
      state: 'Tamil Nadu',
      district: 'Chennai',
      nationality: 'South African (Foreign National)',
      category: 'GENERAL',
      quotaType: 'FOREIGN_NATIONAL',
      institutionId: inst3Id,
      institutionName: 'Anna University, College of Engineering Guindy',
      programmeId: 'prog-anna-ece',
      programmeName: 'B.E. in Electronics & Communication Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-22',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-23T14:00:00Z',
      apaarChecksumOk: true,
    },
    {
      id: 'stu-011',
      studentId: 'VJTI-2024-IT-008',
      apaarId: validApaar7,
      maskedApaarId: maskApaarId(validApaar7),
      fullName: 'Neha Pradeep Patil',
      fatherName: 'Pradeep Patil',
      motherName: 'Suman Patil',
      dateOfBirth: '2005-07-10',
      gender: 'FEMALE',
      email: 'neha.patil@vjti.ac.in',
      mobile: '+91-9820123456',
      address: 'Dadar West, Mumbai, Maharashtra',
      state: 'Maharashtra',
      district: 'Mumbai City',
      nationality: 'Indian',
      category: 'ST',
      quotaType: 'REGULAR',
      institutionId: inst4Id,
      institutionName: 'Veermata Jijabai Technological Institute',
      programmeId: 'prog-vjti-it',
      programmeName: 'B.Tech in Information Technology',
      academicYear: '2024-2025',
      admissionDate: '2024-07-18',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-19T16:45:00Z',
      apaarChecksumOk: true,
    },
    {
      id: 'stu-012',
      studentId: 'GEC-2024-MECH-025',
      apaarId: validApaar8,
      maskedApaarId: maskApaarId(validApaar8),
      fullName: 'Devanarayanan Namboothiri',
      fatherName: 'Madhavan Namboothiri',
      motherName: 'Sreedevi N',
      dateOfBirth: '2005-01-29',
      gender: 'MALE',
      email: 'devan.n@gectcr.ac.in',
      mobile: '+91-9447123456',
      address: 'Cherpu, Thrissur, Kerala',
      state: 'Kerala',
      district: 'Thrissur',
      nationality: 'Indian',
      category: 'GENERAL',
      quotaType: 'REGULAR',
      institutionId: inst5Id,
      institutionName: 'Government Engineering College Thrissur',
      programmeId: 'prog-gec-mech',
      programmeName: 'B.Tech in Mechanical Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-19',
      currentStatus: 'ACTIVE',
      apaarStatus: 'VALID',
      apaarValidationDate: '2024-07-20T09:30:00Z',
      apaarChecksumOk: true,
    },
  ];

  const duplicateAlerts: DuplicateAlert[] = [
    {
      id: 'dup-001',
      apaarId: crossDupApaar,
      studentIdA: 'COEP-2024-CSE-006',
      studentNameA: 'Tanvi Rajesh Kulkarni',
      institutionIdA: inst1Id,
      institutionNameA: 'COEP Technological University',
      studentIdB: 'IITD-2024-CSE-042',
      studentNameB: 'Tanvi R Kulkarni',
      institutionIdB: inst2Id,
      institutionNameB: 'Indian Institute of Technology Delhi',
      similarityScore: 98,
      reason: 'Identical 12-digit APAAR ID registered across two AICTE institutions simultaneously with identical DOB (2005-09-12) and parent name.',
      status: 'NEW',
      detectedAt: '2024-07-29T10:05:12Z',
    },
  ];

  const credentials: VerificationCredential[] = [
    {
      id: 'cred-001',
      credentialId: 'EDUVERIFY-2024-COEP-001',
      token: 'tok_sig_a8f9c2e1b40d7e63f912c4',
      studentId: 'COEP-2024-CSE-001',
      studentName: 'Aarav Sharma',
      maskedApaar: maskApaarId(validApaar1),
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      programmeName: 'B.Tech in Computer Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-15',
      issueDate: '2024-07-16',
      status: 'ACTIVE',
      verificationCount: 7,
      lastVerifiedAt: '2024-09-15T14:32:00Z',
    },
    {
      id: 'cred-002',
      credentialId: 'EDUVERIFY-2024-IITD-001',
      token: 'tok_sig_b7e3f1a9c40d2e85a034d1',
      studentId: 'IITD-2024-CSE-001',
      studentName: 'Aditya Sen',
      maskedApaar: maskApaarId(validApaar4),
      institutionId: inst2Id,
      institutionName: 'Indian Institute of Technology Delhi',
      programmeName: 'B.Tech in Computer Science and Engineering',
      academicYear: '2024-2025',
      admissionDate: '2024-07-15',
      issueDate: '2024-07-16',
      status: 'ACTIVE',
      verificationCount: 4,
      lastVerifiedAt: '2024-08-20T11:15:00Z',
    },
  ];

  const users: User[] = [
    {
      id: 'usr-aicte-admin',
      email: 'admin@aicte.gov.in',
      passwordHash: 'aicte@2025',
      fullName: 'Dr. Anil Sahasrabudhe',
      role: 'SUPER_ADMIN',
      title: 'AICTE Chief Regulatory Officer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-coep-admin',
      email: 'admin@coep.ac.in',
      passwordHash: 'coep@2025',
      fullName: 'Prof. R. K. Deshmukh',
      role: 'INSTITUTION_ADMIN',
      institutionId: inst1Id,
      title: 'Dean of Academic Admissions, COEP Pune',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-student-aarav',
      email: 'aarav.sharma@student.eduverify.gov.in',
      passwordHash: 'student@2025',
      fullName: 'Aarav Sharma',
      role: 'STUDENT',
      institutionId: inst1Id,
      studentId: 'COEP-2024-CSE-001',
      title: 'B.Tech Student (Year 1)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-verifier-tcs',
      email: 'priya.nair@tcs.com',
      passwordHash: 'tcs@2025',
      fullName: 'Priya Nair',
      role: 'VERIFIER',
      verifierOrg: 'Tata Consultancy Services',
      title: 'Lead Academic Background Screener',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const verificationLogs: VerificationLog[] = [
    {
      id: 'vlog-001',
      credentialId: 'EDUVERIFY-2024-COEP-001',
      studentId: 'COEP-2024-CSE-001',
      studentName: 'Aarav Sharma',
      verifierOrg: 'Tata Consultancy Services',
      verifierName: 'Priya Nair',
      purpose: 'Campus Recruitment Verification',
      verifiedAt: '2024-09-15T14:32:00Z',
      outcome: 'SUCCESS',
    },
    {
      id: 'vlog-002',
      credentialId: 'EDUVERIFY-2024-COEP-001',
      studentId: 'COEP-2024-CSE-001',
      studentName: 'Aarav Sharma',
      verifierOrg: 'National Scholarship Portal',
      verifierName: 'Verification Officer 04',
      purpose: 'Pre-Matric / Post-Matric Merit Scholarship Verification',
      verifiedAt: '2024-08-10T09:12:00Z',
      outcome: 'SUCCESS',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-001',
      userId: 'usr-coep-admin',
      userName: 'Prof. R. K. Deshmukh',
      userRole: 'INSTITUTION_ADMIN',
      action: 'STUDENT_ENROLLED',
      entityType: 'Student',
      entityId: 'COEP-2024-CSE-001',
      details: 'Registered student Aarav Sharma under regular quota with verified APAAR ID.',
      timestamp: '2024-07-15T10:30:00Z',
      ipAddress: '14.139.122.5',
    },
    {
      id: 'audit-002',
      userId: 'system',
      userName: 'EduVerify Automated Engine',
      userRole: 'SUPER_ADMIN',
      action: 'DUPLICATE_DETECTED',
      entityType: 'DuplicateAlert',
      entityId: 'dup-001',
      details: 'Detected cross-institution APAAR conflict between COEP Pune and IIT Delhi.',
      timestamp: '2024-07-29T10:05:12Z',
      ipAddress: '127.0.0.1',
    },
    {
      id: 'audit-003',
      userId: 'system',
      userName: 'Intake Compliance Engine',
      userRole: 'SUPER_ADMIN',
      action: 'INTAKE_CAP_EXCEEDED',
      entityType: 'Institution',
      entityId: inst1Id,
      details: 'COEP Pune current regular enrolment (65) exceeds approved AICTE intake (60) by 5 seats.',
      timestamp: '2024-07-22T18:00:00Z',
      ipAddress: '127.0.0.1',
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-001',
      targetRole: 'SUPER_ADMIN',
      title: 'Excess Admission Detected at COEP Pune',
      message: 'COEP Technological University has reported 65 admissions against an approved intake of 60 in B.Tech Computer Engineering.',
      type: 'ERROR',
      isRead: false,
      createdAt: '2024-07-22T18:00:00Z',
      link: '/admin/intake',
    },
    {
      id: 'notif-002',
      targetRole: 'SUPER_ADMIN',
      title: 'High-Risk Duplicate Enrolment Alert',
      message: 'Student Tanvi Rajesh Kulkarni has active admissions at both COEP Pune and IIT Delhi with matching APAAR ID.',
      type: 'WARNING',
      isRead: false,
      createdAt: '2024-07-29T10:05:12Z',
      link: '/admin/duplicates',
    },
    {
      id: 'notif-003',
      targetRole: 'INSTITUTION_ADMIN',
      targetUserId: 'usr-coep-admin',
      title: 'Intake Limit Warning',
      message: 'Approved intake for Computer Engineering exceeded. Please review admissions and submit regularization request to AICTE.',
      type: 'WARNING',
      isRead: false,
      createdAt: '2024-07-22T18:05:00Z',
      link: '/institution/intake',
    },
    {
      id: 'notif-004',
      targetRole: 'STUDENT',
      targetUserId: 'usr-student-aarav',
      title: 'Academic Credential Issued',
      message: 'Your official QR-backed digital student verification credential is now active.',
      type: 'SUCCESS',
      isRead: true,
      createdAt: '2024-07-16T12:00:00Z',
      link: '/student/credentials',
    },
  ];

  const bulkUploads: BulkUploadRecord[] = [
    {
      id: 'up-001',
      institutionId: inst1Id,
      institutionName: 'COEP Technological University',
      fileName: 'COEP_BTECH_2024_BATCH_1.csv',
      totalRecords: 12,
      successfulImports: 10,
      invalidRecords: 1,
      duplicateRecords: 1,
      pendingRecords: 0,
      uploadedAt: '2024-07-22T14:30:00Z',
      errors: [
        {
          row: 4,
          field: 'apaarId',
          error: 'APAAR ID missing',
          rawData: { name: 'Vikramaditya Rathore', roll: 'COEP-2024-CSE-004' },
        },
        {
          row: 5,
          field: 'apaarId',
          error: 'Verhoeff checksum mismatch',
          rawData: { name: 'Pooja Hegde', roll: 'COEP-2024-CSE-005' },
        },
      ],
    },
  ];

  return {
    users,
    institutions,
    programmes,
    students,
    duplicateAlerts,
    credentials,
    verificationLogs,
    auditLogs,
    notifications,
    bulkUploads,
  };
}

class EduVerifyDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Failed to read db file, initializing default data:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db file:', err);
    }
  }

  public resetToDefault(): DatabaseSchema {
    const initial = getInitialData();
    this.data = initial;
    this.saveData(initial);
    return this.data;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // --- INSTITUTIONS ---
  public getInstitutions(): Institution[] {
    return this.data.institutions;
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.data.institutions.find((i) => i.id === id);
  }

  public updateInstitution(id: string, updates: Partial<Institution>): Institution | undefined {
    const idx = this.data.institutions.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.institutions[idx] = { ...this.data.institutions[idx], ...updates };
    this.saveData(this.data);
    return this.data.institutions[idx];
  }

  public addInstitution(inst: Institution): Institution {
    this.data.institutions.push(inst);
    this.saveData(this.data);
    return inst;
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.data.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id || s.studentId === id);
  }

  public addStudent(student: Student): Student {
    this.data.students.unshift(student);
    // Update institution enrolment count
    const inst = this.data.institutions.find((i) => i.id === student.institutionId);
    if (inst) {
      if (student.quotaType === 'REGULAR') {
        inst.currentEnrolment += 1;
      } else {
        inst.supernumeraryEnrolment += 1;
        if (student.quotaType === 'NRI') inst.nriEnrolment += 1;
        if (student.quotaType === 'OCI') inst.ociEnrolment += 1;
        if (student.quotaType === 'FOREIGN_NATIONAL') inst.foreignEnrolment += 1;
      }
    }
    this.saveData(this.data);
    return student;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.data.students[idx] = { ...this.data.students[idx], ...updates };
    this.saveData(this.data);
    return this.data.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    const [deleted] = this.data.students.splice(idx, 1);
    const inst = this.data.institutions.find((i) => i.id === deleted.institutionId);
    if (inst && deleted.quotaType === 'REGULAR' && inst.currentEnrolment > 0) {
      inst.currentEnrolment -= 1;
    }
    this.saveData(this.data);
    return true;
  }

  // --- DUPLICATE ALERTS ---
  public getDuplicateAlerts(): DuplicateAlert[] {
    return this.data.duplicateAlerts;
  }

  public addDuplicateAlert(alert: DuplicateAlert): DuplicateAlert {
    this.data.duplicateAlerts.unshift(alert);
    this.saveData(this.data);
    return alert;
  }

  public updateDuplicateAlert(id: string, updates: Partial<DuplicateAlert>): DuplicateAlert | undefined {
    const idx = this.data.duplicateAlerts.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.data.duplicateAlerts[idx] = { ...this.data.duplicateAlerts[idx], ...updates };
    this.saveData(this.data);
    return this.data.duplicateAlerts[idx];
  }

  // --- VERIFICATION CREDENTIALS ---
  public getCredentials(): VerificationCredential[] {
    return this.data.credentials;
  }

  public getCredentialByToken(token: string): VerificationCredential | undefined {
    return this.data.credentials.find((c) => c.token === token || c.credentialId === token || c.studentId === token);
  }

  public getCredentialByStudentId(studentId: string): VerificationCredential | undefined {
    return this.data.credentials.find((c) => c.studentId === studentId);
  }

  public addCredential(cred: VerificationCredential): VerificationCredential {
    this.data.credentials.unshift(cred);
    this.saveData(this.data);
    return cred;
  }

  public recordVerification(log: VerificationLog): void {
    this.data.verificationLogs.unshift(log);
    const cred = this.data.credentials.find((c) => c.credentialId === log.credentialId);
    if (cred) {
      cred.verificationCount += 1;
      cred.lastVerifiedAt = log.verifiedAt;
    }
    this.saveData(this.data);
  }

  public getVerificationLogs(): VerificationLog[] {
    return this.data.verificationLogs;
  }

  // --- AUDIT LOGS ---
  public addAuditLog(entry: Omit<AuditLog, 'id'>): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...entry,
    };
    this.data.auditLogs.unshift(log);
    this.saveData(this.data);
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(role?: string, userId?: string): Notification[] {
    return this.data.notifications.filter((n) => {
      if (!role && !userId) return true;
      if (n.targetRole === 'ALL') return true;
      if (userId && n.targetUserId === userId) return true;
      if (role && n.targetRole === role) return true;
      return false;
    });
  }

  public addNotification(n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...n,
    };
    this.data.notifications.unshift(notif);
    this.saveData(this.data);
    return notif;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveData(this.data);
    }
  }

  // --- BULK UPLOADS ---
  public getBulkUploads(): BulkUploadRecord[] {
    return this.data.bulkUploads;
  }

  public addBulkUpload(record: BulkUploadRecord): BulkUploadRecord {
    this.data.bulkUploads.unshift(record);
    this.saveData(this.data);
    return record;
  }
}

export const db = new EduVerifyDatabase();
