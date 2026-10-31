import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { db } from '../database/db.ts';
import {
  validateVerhoeff,
  generateVerhoeffCheckDigit,
  maskApaarId,
  formatApaarDisplay,
  validateApaarStructure,
  generateSampleApaar,
} from '../services/apaarValidator.ts';
import { scanForDuplicates, registerDuplicateAlertIfFound } from '../services/duplicateEngine.ts';
import { analyzeInstitutionIntake, getAllIntakeAnalyses } from '../services/intakeEngine.ts';
import {
  generateCredentialToken,
  issueStudentCredential,
  verifyCredentialByToken,
} from '../services/verificationEngine.ts';
import { apiApp } from '../apiApp.ts';

// Helper to make mock HTTP requests to express app without running on network port
async function testRequest(
  method: string,
  path: string,
  options: { body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: any; headers: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const httpMocks = {
      method: method.toUpperCase(),
      url: path,
      path: path.split('?')[0],
      query: {},
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body || {},
    };

    // Parse query string if present
    if (path.includes('?')) {
      const qStr = path.split('?')[1];
      const params = new URLSearchParams(qStr);
      params.forEach((val, key) => {
        (httpMocks.query as any)[key] = val;
      });
    }

    const resEvents = new EventEmitter();
    let statusCode = 200;
    const responseHeaders: Record<string, any> = {};
    let responseBody: any = '';

    const res: any = {
      statusCode: 200,
      setHeader(name: string, value: any) {
        responseHeaders[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return responseHeaders[name.toLowerCase()];
      },
      status(code: number) {
        statusCode = code;
        res.statusCode = code;
        return res;
      },
      json(data: any) {
        responseHeaders['content-type'] = 'application/json';
        responseBody = data;
        resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
      },
      send(data: any) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
      },
      end(data?: any) {
        if (data && !responseBody) responseBody = data;
        resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
      },
    };

    try {
      apiApp(httpMocks as any, res as any, (err?: any) => {
        if (err) reject(err);
        else resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
      });
    } catch (e) {
      reject(e);
    }
  });
}

describe('=== EDUVERIFY BACKEND TEST SUITE ===', () => {
  beforeEach(() => {
    // Reset database to initial pristine state before test groups
    db.resetToDefault();
  });

  /* -------------------------------------------------------------------------- */
  /* 1. APAAR VALIDATOR & VERHOEFF CHECKSUM TESTS                              */
  /* -------------------------------------------------------------------------- */
  describe('1. APAAR Validator Service (Verhoeff Algorithm)', () => {
    test('generateVerhoeffCheckDigit creates a digit that satisfies validateVerhoeff', () => {
      const base11 = '98432109845';
      const checkDigit = generateVerhoeffCheckDigit(base11);
      assert.equal(typeof checkDigit, 'number');
      assert.ok(checkDigit >= 0 && checkDigit <= 9);

      const full12 = `${base11}${checkDigit}`;
      assert.equal(validateVerhoeff(full12), true);
    });

    test('generateSampleApaar produces guaranteed valid 12-digit APAAR', () => {
      for (let i = 0; i < 5; i++) {
        const sample = generateSampleApaar();
        assert.equal(sample.length, 12);
        assert.ok(/^\d{12}$/.test(sample));
        assert.equal(validateVerhoeff(sample), true);

        const val = validateApaarStructure(sample);
        assert.equal(val.isValid, true);
        assert.equal(val.status, 'VALID');
        assert.equal(val.code, 'SUCCESS_VALIDATED');
        assert.equal(val.isChecksumValid, true);
      }
    });

    test('maskApaarId masks first 8 digits and preserves last 4 digits', () => {
      assert.equal(maskApaarId('984321098451'), '•••• •••• 8451');
      assert.equal(maskApaarId('9843 2109 8451'), '•••• •••• 8451');
      assert.equal(maskApaarId('9843-2109-8451'), '•••• •••• 8451');
      assert.equal(maskApaarId(''), '•••• •••• ••••');
      assert.equal(maskApaarId(undefined), '•••• •••• ••••');
    });

    test('formatApaarDisplay separates 12 digits into 4-digit groups', () => {
      assert.equal(formatApaarDisplay('984321098451'), '9843 2109 8451');
      assert.equal(formatApaarDisplay('9843-2109-8451'), '9843 2109 8451');
      assert.equal(formatApaarDisplay(''), '');
    });

    test('validateApaarStructure detects missing, non-numeric, repetitive, and bad checksums', () => {
      // Empty
      const resEmpty = validateApaarStructure('');
      assert.equal(resEmpty.isValid, false);
      assert.equal(resEmpty.code, 'ERR_APAAR_MISSING');

      // Non-numeric
      const resAlpha = validateApaarStructure('98432109845A');
      assert.equal(resAlpha.isValid, false);
      assert.equal(resAlpha.code, 'ERR_APAAR_NON_NUMERIC');

      // Invalid length
      const resShort = validateApaarStructure('123456');
      assert.equal(resShort.isValid, false);
      assert.equal(resShort.code, 'ERR_APAAR_LENGTH');

      // Repetitive identical digits
      const resRep = validateApaarStructure('111111111111');
      assert.equal(resRep.isValid, false);
      assert.equal(resRep.code, 'ERR_APAAR_REPETITIVE');

      // Bad checksum
      const valid = generateSampleApaar('12345678901');
      const badDigit = (Number(valid.slice(-1)) + 1) % 10;
      const invalidChecksum = `${valid.slice(0, 11)}${badDigit}`;
      const resBadCheck = validateApaarStructure(invalidChecksum);
      assert.equal(resBadCheck.isValid, false);
      assert.equal(resBadCheck.code, 'ERR_CHECKSUM_MISMATCH');
    });

    test('validateApaarStructure accepts formatted input with spaces and hyphens', () => {
      const valid = generateSampleApaar('45678901234');
      const formatted = `${valid.slice(0, 4)}-${valid.slice(4, 8)}-${valid.slice(8, 12)}`;
      const res = validateApaarStructure(formatted);
      assert.equal(res.isValid, true);
      assert.equal(res.cleanApaar, valid);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. INTAKE & COMPLIANCE ENGINE TESTS                                        */
  /* -------------------------------------------------------------------------- */
  describe('2. Intake & Admission Quota Compliance Engine', () => {
    test('analyzeInstitutionIntake flags excess admissions accurately', () => {
      // inst1 (COEP Pune) has approvedIntake: 60, currentEnrolment: 65
      const inst1 = db.getInstitutionById('inst-coep-pune');
      assert.ok(inst1);

      const analysis = analyzeInstitutionIntake(inst1);
      assert.equal(analysis.approvedIntake, 60);
      assert.equal(analysis.regularEnrolment, 65);
      assert.equal(analysis.excessAdmissions, 5);
      assert.equal(analysis.isExceeded, true);
      assert.equal(analysis.status, 'EXCEEDED');
      assert.ok(analysis.violations.length > 0);
      assert.ok(analysis.violations.some((v) => v.includes('exceeds approved intake')));
    });

    test('analyzeInstitutionIntake verifies compliant institution within quota', () => {
      // inst2 (IIT Delhi) has approvedIntake: 120, currentEnrolment: 114
      const inst2 = db.getInstitutionById('inst-iit-delhi');
      assert.ok(inst2);

      const analysis = analyzeInstitutionIntake(inst2);
      assert.equal(analysis.approvedIntake, 120);
      assert.equal(analysis.isExceeded, false);
      assert.equal(analysis.remainingSeats, 6);
      assert.equal(analysis.status, 'NEAR_CAPACITY');
    });

    test('getAllIntakeAnalyses returns analysis for all institutions in registry', () => {
      const analyses = getAllIntakeAnalyses();
      assert.equal(analyses.length, db.getInstitutions().length);
      analyses.forEach((a) => {
        assert.ok(a.institutionId);
        assert.ok(a.approvedIntake > 0);
        assert.ok(typeof a.regularUtilizationPercent === 'number');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. DUPLICATE DETECTION ENGINE TESTS                                       */
  /* -------------------------------------------------------------------------- */
  describe('3. Intelligent Duplicate Enrolment Engine', () => {
    test('detects exact APAAR conflict across different institutions', () => {
      // Student Tanvi at COEP Pune has crossDupApaar
      const stu6 = db.getStudentById('COEP-2024-CSE-006');
      assert.ok(stu6);

      const candidate = {
        studentId: 'NEW-CAND-001',
        apaarId: stu6.apaarId,
        institutionId: 'inst-anna-univ', // Different institution
        fullName: 'Candidate Test',
      };

      const result = scanForDuplicates(candidate);
      assert.equal(result.hasDuplicate, true);
      assert.equal(result.score, 98);
      assert.equal(result.matchType, 'EXACT_APAAR');
      assert.ok(result.reason.includes('Cross-Institution Conflict'));
      assert.ok(result.matchedStudent);
    });

    test('detects exact APAAR conflict within same institution', () => {
      const stu1 = db.getStudentById('COEP-2024-CSE-001');
      assert.ok(stu1);

      const candidate = {
        studentId: 'COEP-NEW-009',
        apaarId: stu1.apaarId,
        institutionId: stu1.institutionId,
        fullName: 'Duplicate In Same College',
      };

      const result = scanForDuplicates(candidate);
      assert.equal(result.hasDuplicate, true);
      assert.equal(result.score, 99);
      assert.ok(result.reason.includes('in the same institution'));
    });

    test('detects fuzzy duplicate by Normalized Name + Exact Date of Birth', () => {
      const stu2 = db.getStudentById('COEP-2024-CSE-002'); // Ananya Iyer, 2005-08-22
      assert.ok(stu2);

      const candidate = {
        studentId: 'VJTI-2024-099',
        institutionId: 'inst-vjti-mumbai',
        fullName: 'Ananya  Iyer', // same normalized name
        dateOfBirth: '2005-08-22',
        apaarId: generateSampleApaar(), // distinct APAAR
      };

      const result = scanForDuplicates(candidate);
      assert.equal(result.hasDuplicate, true);
      assert.equal(result.matchType, 'FUZZY_NAME_DOB');
      assert.ok(result.score >= 85);
      assert.equal(result.matchedStudent?.studentId, stu2.studentId);
    });

    test('returns hasDuplicate: false for completely distinct candidate', () => {
      const candidate = {
        studentId: 'UNIQUE-STU-001',
        institutionId: 'inst-coep-pune',
        fullName: 'Unique Person Never Enrolled',
        dateOfBirth: '1999-12-31',
        apaarId: generateSampleApaar(),
        mobile: '+91-9111222333',
      };

      const result = scanForDuplicates(candidate);
      assert.equal(result.hasDuplicate, false);
      assert.equal(result.score, 0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. VERIFICATION ENGINE & CREDENTIAL INTEGRITY TESTS                        */
  /* -------------------------------------------------------------------------- */
  describe('4. Tamper-Evident Verification Engine', () => {
    test('generateCredentialToken creates reproducible HMAC signature prefix', () => {
      const token1 = generateCredentialToken('STU-100', 'INST-1');
      assert.ok(token1.startsWith('tok_sig_'));
      assert.equal(token1.length, 32);
    });

    test('issueStudentCredential creates active credential and stores it', () => {
      const stu = db.getStudentById('COEP-2024-CSE-003');
      assert.ok(stu);

      const cred = issueStudentCredential(stu);
      assert.ok(cred.id);
      assert.ok(cred.token.startsWith('tok_sig_'));
      assert.equal(cred.studentId, stu.studentId);
      assert.equal(cred.status, 'ACTIVE');

      // Calling again returns existing credential without duplicates
      const cred2 = issueStudentCredential(stu);
      assert.equal(cred2.id, cred.id);
    });

    test('verifyCredentialByToken succeeds with valid token or student roll ID', () => {
      const result = verifyCredentialByToken('COEP-2024-CSE-001', 'Test Screener', 'Agent 007');
      assert.equal(result.verified, true);
      assert.ok(result.credential);
      assert.equal(result.credential.studentId, 'COEP-2024-CSE-001');
      assert.equal(result.credential.officialAicteApproved, true);
      assert.ok(result.credential.verificationCount >= 1);
    });

    test('verifyCredentialByToken fails with invalid identifier and logs attempt', () => {
      const initialLogs = db.getVerificationLogs().length;
      const result = verifyCredentialByToken('INVALID_TOKEN_XYZ_123');
      assert.equal(result.verified, false);
      assert.ok(result.message.includes('not found'));

      // Failed attempt is logged for audit security
      const newLogs = db.getVerificationLogs();
      assert.equal(newLogs.length, initialLogs + 1);
      assert.equal(newLogs[0].outcome, 'INVALID_TOKEN');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. REST API ENDPOINTS INTEGRATION TESTS                                    */
  /* -------------------------------------------------------------------------- */
  describe('5. Express REST API Routes', () => {
    test('GET /api/health returns 200 and healthy platform metrics', async () => {
      const res = await testRequest('GET', '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, 'HEALTHY');
      assert.ok(res.body.database.students > 0);
      assert.ok(res.body.database.institutions > 0);
    });

    test('GET /api/auth/demo-users returns seeded user personas', async () => {
      const res = await testRequest('GET', '/api/auth/demo-users');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.users));
      assert.equal(res.body.users.length, 4);

      const roles = res.body.users.map((u: any) => u.role);
      assert.ok(roles.includes('SUPER_ADMIN'));
      assert.ok(roles.includes('INSTITUTION_ADMIN'));
      assert.ok(roles.includes('STUDENT'));
      assert.ok(roles.includes('VERIFIER'));
    });

    test('POST /api/auth/login handles valid and invalid credentials', async () => {
      // Valid
      const resValid = await testRequest('POST', '/api/auth/login', {
        body: { email: 'admin@aicte.gov.in' },
      });
      assert.equal(resValid.status, 200);
      assert.equal(resValid.body.success, true);
      assert.equal(resValid.body.user.role, 'SUPER_ADMIN');

      // Invalid
      const resInvalid = await testRequest('POST', '/api/auth/login', {
        body: { email: 'unknown@example.com' },
      });
      assert.equal(resInvalid.status, 401);
      assert.equal(resInvalid.body.success, false);
    });

    test('GET /api/institutions supports search and status filtering', async () => {
      const res = await testRequest('GET', '/api/institutions?search=COEP');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institutions.length, 1);
      assert.equal(res.body.institutions[0].shortName, 'COEP Pune');
      assert.ok(res.body.institutions[0].analysis);
    });

    test('POST /api/institutions creates a new institution with validation', async () => {
      const res = await testRequest('POST', '/api/institutions', {
        body: {
          name: 'National Institute of Technology Karnataka',
          shortName: 'NIT Surathkal',
          state: 'Karnataka',
          approvedIntake: 150,
          establishedYear: 1960,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution.shortName, 'NIT Surathkal');
      assert.equal(res.body.institution.approvalStatus, 'PENDING');
    });

    test('PUT /api/institutions/:id updates institution details', async () => {
      const res = await testRequest('PUT', '/api/institutions/inst-coep-pune', {
        body: {
          contactEmail: 'updated.admissions@coep.ac.in',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution.contactEmail, 'updated.admissions@coep.ac.in');
    });

    test('GET and POST /api/programmes manages courses', async () => {
      const getRes = await testRequest('GET', '/api/programmes?institutionId=inst-coep-pune');
      assert.equal(getRes.status, 200);
      assert.ok(getRes.body.programmes.length >= 1);

      const postRes = await testRequest('POST', '/api/programmes', {
        body: {
          institutionId: 'inst-coep-pune',
          name: 'M.Tech in Artificial Intelligence',
          code: 'MTECH-AI',
          degreeLevel: 'PG',
          approvedIntake: 30,
          durationYears: 2,
        },
      });

      assert.equal(postRes.status, 201);
      assert.equal(postRes.body.success, true);
      assert.equal(postRes.body.programme.name, 'M.Tech in Artificial Intelligence');
    });

    test('POST /api/apaar/generate-sample returns valid sample APAAR ID', async () => {
      const res = await testRequest('POST', '/api/apaar/generate-sample');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.apaarId.length, 12);
      assert.equal(res.body.result.isValid, true);
    });

    test('POST /api/students enroller adds student and prevents duplicate roll in same college', async () => {
      const validApaar = generateSampleApaar();
      const studentPayload = {
        studentId: 'COEP-2024-TEST-999',
        fullName: 'Kiran Prakash Kadam',
        fatherName: 'Prakash Kadam',
        motherName: 'Sunita Kadam',
        dateOfBirth: '2005-10-15',
        gender: 'MALE',
        apaarId: validApaar,
        institutionId: 'inst-coep-pune',
        category: 'OBC',
        quotaType: 'REGULAR',
      };

      // 1. First registration succeeds
      const res1 = await testRequest('POST', '/api/students', { body: studentPayload });
      assert.equal(res1.status, 201);
      assert.equal(res1.body.success, true);
      assert.equal(res1.body.student.apaarStatus, 'VALID');
      assert.ok(res1.body.credential);

      // 2. Duplicate registration with same student ID at same institution returns 409 Conflict
      const res2 = await testRequest('POST', '/api/students', { body: studentPayload });
      assert.equal(res2.status, 409);
      assert.equal(res2.body.success, false);
      assert.ok(res2.body.message.includes('already exists at this institution'));
    });

    test('DELETE /api/students/:id deletes student and marks credential revoked', async () => {
      const stu = db.getStudentById('COEP-2024-CSE-002');
      assert.ok(stu);

      // Ensure credential exists
      issueStudentCredential(stu);

      const delRes = await testRequest('DELETE', `/api/students/${stu.id}`);
      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.success, true);

      // Verify student deleted
      assert.equal(db.getStudentById(stu.id), undefined);

      // Verify credential revoked
      const cred = db.getCredentialByStudentId(stu.studentId);
      assert.equal(cred?.status, 'REVOKED');
    });

    test('CSV Reports /api/reports/*/csv return well-formed CSV headers and content', async () => {
      const resStudents = await testRequest('GET', '/api/reports/students/csv');
      assert.equal(resStudents.status, 200);
      assert.ok(resStudents.headers['content-type'].includes('text/csv'));
      assert.ok(resStudents.body.includes('Student ID,Full Name,APAAR ID (Masked)'));

      const resIntake = await testRequest('GET', '/api/reports/intake/csv');
      assert.equal(resIntake.status, 200);
      assert.ok(resIntake.body.includes('Institution ID,Institution Name,Approved Intake'));

      const resDuplicates = await testRequest('GET', '/api/reports/duplicates/csv');
      assert.equal(resDuplicates.status, 200);
      assert.ok(resDuplicates.body.includes('Alert ID,APAAR ID (Masked),Student A'));
    });

    test('POST /api/verification/verify verifies student authenticity', async () => {
      const res = await testRequest('POST', '/api/verification/verify', {
        body: {
          token: 'COEP-2024-CSE-001',
          verifierOrg: 'Infosys Limited',
          verifierName: 'Campus Hiring Team',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.verified, true);
      assert.equal(res.body.credential.studentName, 'Aarav Sharma');
      assert.equal(res.body.credential.officialAicteApproved, true);
    });

    test('POST /api/system/reset restores synthetic Indian higher education data', async () => {
      const res = await testRequest('POST', '/api/system/reset');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.message.includes('Database reset'));
    });
  });
});
