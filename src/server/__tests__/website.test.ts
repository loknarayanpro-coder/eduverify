import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../database/db.ts';
import { apiApp } from '../apiApp.ts';

// Helper to make mock HTTP requests to express app
async function makeRequest(
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

    if (path.includes('?')) {
      const qStr = path.split('?')[1];
      const params = new URLSearchParams(qStr);
      params.forEach((val, key) => {
        (httpMocks.query as any)[key] = val;
      });
    }

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

describe('=== COMPLETE WEBSITE END-TO-END WORKFLOW SUITE ===', () => {
  beforeEach(() => {
    db.resetToDefault();
  });

  /* -------------------------------------------------------------------------- */
  /* WORKFLOW 1: AICTE SUPER ADMIN SCENARIO                                     */
  /* -------------------------------------------------------------------------- */
  describe('Workflow 1: AICTE Super Admin National Operations', () => {
    test('Super admin accesses national overview, monitors intake, and resolves duplicates', async () => {
      // 1. Fetch national analytics metrics
      const analytics = await makeRequest('GET', '/api/analytics/admin');
      assert.equal(analytics.status, 200);
      assert.equal(analytics.body.success, true);
      assert.ok(analytics.body.stats.totalStudents >= 10);
      assert.ok(analytics.body.stats.totalInstitutions >= 6);

      // 2. Fetch intake compliance statistics
      const intakeStats = await makeRequest('GET', '/api/intake/stats');
      assert.equal(intakeStats.status, 200);
      assert.equal(intakeStats.body.success, true);
      assert.ok(intakeStats.body.stats.institutionsExceedingCount >= 1);

      // Verify COEP Pune is flagged for excess admissions
      const coep = intakeStats.body.institutions.find((i: any) => i.institutionId === 'inst-coep-pune');
      assert.ok(coep);
      assert.equal(coep.isExceeded, true);
      assert.equal(coep.excessAdmissions, 5);

      // 3. Review duplicate alerts
      const dups = await makeRequest('GET', '/api/duplicates');
      assert.equal(dups.status, 200);
      assert.ok(dups.body.alerts.length >= 1);
      const targetAlert = dups.body.alerts[0];

      // 4. Resolve the duplicate alert
      const resolveRes = await makeRequest('PATCH', `/api/duplicates/${targetAlert.id}/status`, {
        body: {
          status: 'RESOLVED',
          notes: 'Admissions committee reviewed and verified dual enrolment cancellation at IIT Delhi.',
        },
      });
      assert.equal(resolveRes.status, 200);
      assert.equal(resolveRes.body.success, true);
      assert.equal(resolveRes.body.alert.status, 'RESOLVED');

      // 5. Download official CSV reports
      const csvReports = ['students', 'intake', 'duplicates'];
      for (const rep of csvReports) {
        const repRes = await makeRequest('GET', `/api/reports/${rep}/csv`);
        assert.equal(repRes.status, 200);
        assert.ok(repRes.headers['content-type'].includes('text/csv'));
        assert.ok(repRes.body.length > 50);
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* WORKFLOW 2: INSTITUTION ADMIN SCENARIO                                     */
  /* -------------------------------------------------------------------------- */
  describe('Workflow 2: Institution Admin (COEP Pune) Admissions & Cohort Management', () => {
    test('Institution admin inspects intake, pre-scans candidate, and enrols student with APAAR', async () => {
      // 1. Fetch institution profile & live intake utilization
      const instRes = await makeRequest('GET', '/api/institutions/inst-coep-pune');
      assert.equal(instRes.status, 200);
      assert.equal(instRes.body.institution.shortName, 'COEP Pune');
      assert.ok(instRes.body.institution.analysis);

      // 2. Generate a valid sample APAAR ID via sandbox tool
      const sampleRes = await makeRequest('POST', '/api/apaar/generate-sample');
      assert.equal(sampleRes.status, 200);
      assert.equal(sampleRes.body.result.isValid, true);
      const validApaar = sampleRes.body.apaarId;

      // 3. Pre-scan candidate before submitting admission
      const scanRes = await makeRequest('POST', '/api/duplicates/scan', {
        body: {
          fullName: 'Siddharth Patil',
          studentId: 'COEP-2024-CSE-099',
          dateOfBirth: '2005-03-14',
          apaarId: validApaar,
          institutionId: 'inst-coep-pune',
        },
      });
      assert.equal(scanRes.status, 200);
      assert.equal(scanRes.body.scan.hasDuplicate, false);

      // 4. Enrol candidate
      const enrolRes = await makeRequest('POST', '/api/students', {
        body: {
          studentId: 'COEP-2024-CSE-099',
          fullName: 'Siddharth Patil',
          fatherName: 'Prakash Patil',
          motherName: 'Sunita Patil',
          dateOfBirth: '2005-03-14',
          gender: 'MALE',
          email: 'siddharth.patil@coep.ac.in',
          mobile: '+91-9822334455',
          apaarId: validApaar,
          institutionId: 'inst-coep-pune',
          category: 'GENERAL',
          quotaType: 'REGULAR',
          programmeName: 'B.Tech in Computer Engineering',
          academicYear: '2024-2025',
        },
      });
      assert.equal(enrolRes.status, 201);
      assert.equal(enrolRes.body.success, true);
      assert.equal(enrolRes.body.student.apaarStatus, 'VALID');
      assert.ok(enrolRes.body.credential.token);

      // 5. Simulate bulk cohort upload
      const sampleBatch = [
        {
          studentId: 'COEP-BATCH-001',
          fullName: 'Sneha Joshi',
          dateOfBirth: '2005-05-12',
          apaarId: validApaar, // Should flag as duplicate because just enrolled above
        },
        {
          studentId: 'COEP-BATCH-002',
          fullName: 'Vikram Shinde',
          dateOfBirth: '2005-07-20',
        },
      ];

      const uploadRes = await makeRequest('POST', '/api/uploads/students', {
        body: {
          institutionId: 'inst-coep-pune',
          fileName: 'COEP_SEMESTER_1_BATCH.csv',
          rows: sampleBatch,
        },
      });
      assert.equal(uploadRes.status, 200);
      assert.equal(uploadRes.body.success, true);
      assert.ok(uploadRes.body.summary.duplicates >= 1);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* WORKFLOW 3: STUDENT PORTAL SCENARIO                                        */
  /* -------------------------------------------------------------------------- */
  describe('Workflow 3: Student Academic Identity & Credential Privacy', () => {
    test('Student accesses masked APAAR profile and active verification credential', async () => {
      const studentId = 'COEP-2024-CSE-001';
      const stuRes = await makeRequest('GET', `/api/students/${studentId}`);
      assert.equal(stuRes.status, 200);
      assert.equal(stuRes.body.success, true);

      // Verify DPDP Act 2023 privacy masking
      const student = stuRes.body.student;
      assert.ok(student.maskedApaarId.startsWith('•••• ••••'));
      assert.equal(student.maskedApaarId.length, 14);

      // Verify credential details
      assert.ok(stuRes.body.credential);
      assert.equal(stuRes.body.credential.status, 'ACTIVE');
      assert.ok(stuRes.body.credential.token.startsWith('tok_sig_'));
    });
  });

  /* -------------------------------------------------------------------------- */
  /* WORKFLOW 4: AUTHORIZED VERIFIER SCENARIO                                   */
  /* -------------------------------------------------------------------------- */
  describe('Workflow 4: Third-Party Employer & Background Screener', () => {
    test('Verifier executes authenticity check and inspects institutional accreditation', async () => {
      // 1. Verify by Student ID
      const verifyRes = await makeRequest('POST', '/api/verification/verify', {
        body: {
          token: 'COEP-2024-CSE-001',
          verifierOrg: 'Tata Consultancy Services',
          verifierName: 'Priya Nair',
          purpose: 'Campus Recruitment Verification',
        },
      });
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.body.success, true);
      assert.equal(verifyRes.body.verified, true);
      assert.equal(verifyRes.body.credential.studentName, 'Aarav Sharma');
      assert.equal(verifyRes.body.credential.institutionName, 'COEP Technological University');
      assert.equal(verifyRes.body.credential.officialAicteApproved, true);

      // 2. Verify by signed token
      const credToken = verifyRes.body.credential.credentialId;
      const tokenRes = await makeRequest('POST', '/api/verification/verify', {
        body: { token: credToken },
      });
      assert.equal(tokenRes.status, 200);
      assert.equal(tokenRes.body.verified, true);

      // 3. Inspect audit trail for logged verification events
      const logsRes = await makeRequest('GET', '/api/verification/logs');
      assert.equal(logsRes.status, 200);
      assert.ok(logsRes.body.logs.length >= 2);
      assert.ok(logsRes.body.logs.some((l: any) => l.verifierOrg === 'Tata Consultancy Services'));
    });
  });

  /* -------------------------------------------------------------------------- */
  /* WORKFLOW 5: PERSONA SWITCHER & SYSTEM RELIABILITY                          */
  /* -------------------------------------------------------------------------- */
  describe('Workflow 5: Seamless Persona Switching & System Resiliency', () => {
    test('Switching persona updates session and generates security audit log', async () => {
      const roles = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT', 'VERIFIER'];
      for (const role of roles) {
        const switchRes = await makeRequest('POST', '/api/auth/switch-persona', {
          body: { role },
        });
        assert.equal(switchRes.status, 200);
        assert.equal(switchRes.body.user.role, role);
      }

      // Verify audit logs record the persona switches
      const auditRes = await makeRequest('GET', '/api/audit');
      assert.equal(auditRes.status, 200);
      const switchLogs = auditRes.body.logs.filter((l: any) => l.action === 'PERSONA_SWITCHED');
      assert.ok(switchLogs.length >= 4);
    });

    test('Healthcheck and system reset return consistent and stable state', async () => {
      const healthRes = await makeRequest('GET', '/api/health');
      assert.equal(healthRes.status, 200);
      assert.equal(healthRes.body.status, 'HEALTHY');

      const resetRes = await makeRequest('POST', '/api/system/reset');
      assert.equal(resetRes.status, 200);
      assert.equal(resetRes.body.success, true);
    });
  });
});
