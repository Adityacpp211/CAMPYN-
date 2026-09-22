import {
  User,
  UserRole,
  Student,
  Faculty,
  Course,
  Department,
  AttendanceSession,
  AttendanceRecord,
  TimetableSlot,
  Assignment,
  Examination,
  MarksEntry,
  FeeDue,
  FeeTransaction,
  ApprovalRequest,
  AuditLog,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('campus_os_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('campus_os_token', token);
    } else {
      localStorage.removeItem('campus_os_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = json.error?.message || json.message || `Request failed with status ${res.status}`;
      const err: any = new Error(errorMsg);
      err.code = json.error?.code;
      err.status = res.status;
      throw err;
    }

    return json.data !== undefined ? json.data : json;
  }

  // Authentication
  public auth = {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      const data = await this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(data.token);
      return data;
    },
    me: async (): Promise<{ user: User }> => {
      return this.request<{ user: User }>('/auth/me');
    },
    switchRole: async (role: UserRole): Promise<{ token: string; user: User }> => {
      const data = await this.request<{ token: string; user: User }>('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      this.setToken(data.token);
      return data;
    },
    logout: async (): Promise<void> => {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } finally {
        this.setToken(null);
      }
    },
  };

  // Students
  public students = {
    list: async (params?: { search?: string; departmentId?: string; section?: string }): Promise<Student[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.departmentId) query.append('departmentId', params.departmentId);
      if (params?.section) query.append('section', params.section);
      return this.request<Student[]>(`/students?${query.toString()}`);
    },
    get: async (id: string): Promise<Student & { attendanceRecords: any[]; marks: any[]; fees: any[] }> => {
      return this.request<Student & { attendanceRecords: any[]; marks: any[]; fees: any[] }>(`/students/${id}`);
    },
  };

  // Faculty
  public faculty = {
    list: async (params?: { departmentId?: string }): Promise<Faculty[]> => {
      const query = new URLSearchParams();
      if (params?.departmentId) query.append('departmentId', params.departmentId);
      return this.request<Faculty[]>(`/faculty?${query.toString()}`);
    },
  };

  // Academics
  public academics = {
    departments: async (): Promise<Department[]> => {
      return this.request<Department[]>('/academics/departments');
    },
    courses: async (params?: { departmentId?: string }): Promise<Course[]> => {
      const query = new URLSearchParams();
      if (params?.departmentId) query.append('departmentId', params.departmentId);
      return this.request<Course[]>(`/academics/courses?${query.toString()}`);
    },
  };

  // Attendance
  public attendance = {
    sessions: async (): Promise<AttendanceSession[]> => {
      return this.request<AttendanceSession[]>('/attendance/sessions');
    },
    records: async (sessionId?: string): Promise<AttendanceRecord[]> => {
      const query = sessionId ? `?sessionId=${sessionId}` : '';
      return this.request<AttendanceRecord[]>(`/attendance/records${query}`);
    },
    updateRecord: async (recordId: string, status: string, reason: string): Promise<any> => {
      return this.request(`/attendance/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      });
    },
    submitCorrection: async (recordId: string, newStatus: string, reason: string): Promise<any> => {
      return this.request('/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify({ recordId, newStatus, reason }),
      });
    },
  };

  // Fees
  public fees = {
    dues: async (): Promise<FeeDue[]> => {
      return this.request<FeeDue[]>('/fees/dues');
    },
    transactions: async (): Promise<FeeTransaction[]> => {
      return this.request<FeeTransaction[]>('/fees/transactions');
    },
    collect: async (feeDueId: string, amount: number, paymentMode: string): Promise<any> => {
      return this.request('/fees/collect', {
        method: 'POST',
        body: JSON.stringify({ feeDueId, amount, paymentMode }),
      });
    },
    refund: async (txnId: string, reason: string): Promise<any> => {
      return this.request(`/fees/transactions/${txnId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  };

  // Governance Approvals
  public approvals = {
    list: async (): Promise<ApprovalRequest[]> => {
      return this.request<ApprovalRequest[]>('/approvals');
    },
    resolve: async (id: string, decision: 'approved' | 'rejected', decisionReason: string): Promise<any> => {
      return this.request(`/approvals/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision, decisionReason }),
      });
    },
  };

  // Cryptographic Audit
  public audit = {
    list: async (params?: { action?: string; entity?: string; actorEmail?: string }): Promise<AuditLog[]> => {
      const query = new URLSearchParams();
      if (params?.action) query.append('action', params.action);
      if (params?.entity) query.append('entity', params.entity);
      if (params?.actorEmail) query.append('actorEmail', params.actorEmail);
      return this.request<AuditLog[]>(`/audit?${query.toString()}`);
    },
    verify: async (): Promise<{ isValid: boolean; totalRecords: number; tamperedIndex?: number; error?: string }> => {
      return this.request('/audit/verify');
    },
  };

  // Timetable
  public timetable = {
    list: async (): Promise<TimetableSlot[]> => {
      return this.request<TimetableSlot[]>('/timetable');
    },
  };

  // Assignments
  public assignments = {
    list: async (): Promise<Assignment[]> => {
      return this.request<Assignment[]>('/assignments');
    },
    submissions: async (asgId: string): Promise<any[]> => {
      return this.request<any[]>(`/assignments/${asgId}/submissions`);
    },
  };

  // Examinations & Marks
  public exams = {
    list: async (): Promise<Examination[]> => {
      return this.request<Examination[]>('/exams');
    },
    marks: async (examId: string): Promise<MarksEntry[]> => {
      return this.request<MarksEntry[]>(`/exams/${examId}/marks`);
    },
    updateMarks: async (id: string, marksObtained: number, grade: string, reason: string): Promise<any> => {
      return this.request(`/exams/marks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ marksObtained, grade, reason }),
      });
    },
  };

  // Dashboard
  public dashboard = {
    stats: async (): Promise<{
      metrics: any;
      recentAudits: AuditLog[];
      lowAttendanceAlerts: any[];
    }> => {
      return this.request('/dashboard/stats');
    },
  };
}

export const api = new ApiClient();
