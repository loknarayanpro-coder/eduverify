import {
  User,
  Institution,
  Student,
  DuplicateAlert,
  VerificationCredential,
  VerificationLog,
  AuditLog,
  Notification,
  BulkUploadRecord,
} from '../server/types.ts';

const API_BASE = '/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('eduverify_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // --- AUTH ---
  async getDemoUsers(): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return res.json();
  }

  async login(email: string): Promise<{ success: boolean; user: User; token: string; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('eduverify_token', data.token);
    }
    return data;
  }

  async switchPersona(role?: string, userId?: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('eduverify_token', data.token);
    }
    return data;
  }

  async getMe(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- INSTITUTIONS ---
  async getInstitutions(params?: Record<string, string>): Promise<{ success: boolean; institutions: (Institution & { analysis: any })[] }> {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/institutions?${query}`);
    return res.json();
  }

  async getInstitution(id: string): Promise<{ success: boolean; institution: Institution & { analysis: any; studentsCount: number } }> {
    const res = await fetch(`${API_BASE}/institutions/${id}`);
    return res.json();
  }

  async createInstitution(data: Partial<Institution>): Promise<{ success: boolean; institution: Institution }> {
    const res = await fetch(`${API_BASE}/institutions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async updateInstitutionStatus(id: string, status: string): Promise<{ success: boolean; institution: Institution }> {
    const res = await fetch(`${API_BASE}/institutions/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  }

  // --- STUDENTS ---
  async getStudents(params?: Record<string, string>): Promise<{ success: boolean; total: number; students: Student[] }> {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/students?${query}`);
    return res.json();
  }

  async getStudent(id: string): Promise<{ success: boolean; student: Student; credential?: VerificationCredential }> {
    const res = await fetch(`${API_BASE}/students/${id}`);
    return res.json();
  }

  async createStudent(student: Partial<Student>): Promise<{ success: boolean; student: Student; credential?: VerificationCredential; duplicateAlert?: DuplicateAlert; message?: string }> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(student),
    });
    return res.json();
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  }

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- PROGRAMMES ---
  async getProgrammes(institutionId?: string): Promise<{ success: boolean; total: number; programmes: any[] }> {
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${API_BASE}/programmes${query}`);
    return res.json();
  }

  // --- APAAR VALIDATION & GENERATION ---
  async validateApaar(apaarId: string): Promise<{ success: boolean; result: any }> {
    const res = await fetch(`${API_BASE}/apaar/validate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ apaarId }),
    });
    return res.json();
  }

  async generateSampleApaar(seed?: string): Promise<{ success: boolean; apaarId: string; result: any }> {
    const res = await fetch(`${API_BASE}/apaar/generate-sample`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ seed }),
    });
    return res.json();
  }

  // --- DUPLICATES ---
  async getDuplicates(): Promise<{ success: boolean; total: number; alerts: DuplicateAlert[] }> {
    const res = await fetch(`${API_BASE}/duplicates`);
    return res.json();
  }

  async scanDuplicate(candidate: Partial<Student>): Promise<{ success: boolean; scan: any }> {
    const res = await fetch(`${API_BASE}/duplicates/scan`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(candidate),
    });
    return res.json();
  }

  async updateDuplicateStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; alert: DuplicateAlert }> {
    const res = await fetch(`${API_BASE}/duplicates/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    return res.json();
  }

  // --- INTAKE ---
  async getIntakeStats(): Promise<{ success: boolean; stats: any; institutions: any[] }> {
    const res = await fetch(`${API_BASE}/intake/stats`);
    return res.json();
  }

  // --- BULK UPLOAD ---
  async uploadStudents(institutionId: string, fileName: string, rows: any[]): Promise<{ success: boolean; summary: any; record: BulkUploadRecord }> {
    const res = await fetch(`${API_BASE}/uploads/students`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ institutionId, fileName, rows }),
    });
    return res.json();
  }

  async getUploadHistory(institutionId?: string): Promise<{ success: boolean; uploads: BulkUploadRecord[] }> {
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${API_BASE}/uploads${query}`);
    return res.json();
  }

  // --- VERIFICATION ---
  async verifyCredential(token: string, verifierOrg?: string, verifierName?: string, purpose?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/verification/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, verifierOrg, verifierName, purpose }),
    });
    return res.json();
  }

  async getVerificationLogs(): Promise<{ success: boolean; total: number; logs: VerificationLog[] }> {
    const res = await fetch(`${API_BASE}/verification/logs`);
    return res.json();
  }

  // --- ANALYTICS ---
  async getAdminAnalytics(): Promise<{ success: boolean; stats: any; stateDistribution: any[]; categoryDistribution: any[]; quotaDistribution: any[]; recentInstitutions: any[]; recentDuplicates: any[] }> {
    const res = await fetch(`${API_BASE}/analytics/admin`);
    return res.json();
  }

  // --- AUDIT & NOTIFICATIONS ---
  async getAuditLogs(): Promise<{ success: boolean; logs: AuditLog[] }> {
    const res = await fetch(`${API_BASE}/audit`);
    return res.json();
  }

  async getNotifications(role?: string, userId?: string): Promise<{ success: boolean; notifications: Notification[] }> {
    const query = new URLSearchParams({ ...(role ? { role } : {}), ...(userId ? { userId } : {}) }).toString();
    const res = await fetch(`${API_BASE}/notifications?${query}`);
    return res.json();
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async getHealth(): Promise<{ success: boolean; status: string; database: any }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }

  getReportDownloadUrl(type: 'students' | 'intake' | 'duplicates'): string {
    return `${API_BASE}/reports/${type}/csv`;
  }

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.json();
  }
}

export const api = new ApiService();
