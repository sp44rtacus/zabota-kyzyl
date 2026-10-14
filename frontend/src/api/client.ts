import {
  District,
  Category,
  WarmingPoint,
  SummaryStats,
  Application,
  TaskAssignment,
  TaskMessage,
  Certificate,
  AnalyticsDashboard,
  TrackData,
  User,
  Role
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('zabota_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('zabota_token', token);
    } else {
      localStorage.removeItem('zabota_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      let errorMsg = `Ошибка сервера (${res.status})`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch {
        // fallback to status text
      }
      throw new Error(errorMsg);
    }

    // if response is a blob or download
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return (await res.blob()) as unknown as T;
    }
    if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument')) {
      return (await res.blob()) as unknown as T;
    }

    return res.json();
  }

  // --- Auth ---
  async login(phone: string, password: string):Promise<{ access_token: string; user_id: number; full_name: string; role: Role }> {
    const data = await this.request<{ access_token: string; user_id: number; full_name: string; role: Role }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ phone, password }) }
    );
    this.setToken(data.access_token);
    return data;
  }

  async quickLogin(role: Role): Promise<{ access_token: string; user_id: number; full_name: string; role: Role }> {
    const data = await this.request<{ access_token: string; user_id: number; full_name: string; role: Role }>(
      '/auth/quick-login',
      { method: 'POST', body: JSON.stringify({ role }) }
    );
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // --- Public ---
  async getDistricts(): Promise<District[]> {
    return this.request<District[]>('/public/districts');
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/public/categories');
  }

  async getWarmingPoints(): Promise<WarmingPoint[]> {
    return this.request<WarmingPoint[]>('/public/warming-points');
  }

  async getCounters(): Promise<SummaryStats> {
    return this.request<SummaryStats>('/public/summary-counters');
  }

  async createApplication(data: any): Promise<Application> {
    return this.request<Application>('/public/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createApplicationWithAudio(formData: FormData): Promise<Application> {
    return this.request<Application>('/public/applications/with-audio', {
      method: 'POST',
      body: formData,
    });
  }

  async trackByUin(uin: string): Promise<TrackData> {
    return this.request<TrackData>(`/public/track/${encodeURIComponent(uin)}`);
  }

  // --- Volunteer ---
  async getVolunteerFeed(params?: { district_id?: number; along_my_routes?: boolean; emergency_only?: boolean }): Promise<Application[]> {
    const query = new URLSearchParams();
    if (params?.district_id) query.append('district_id', params.district_id.toString());
    if (params?.along_my_routes) query.append('along_my_routes', 'true');
    if (params?.emergency_only) query.append('emergency_only', 'true');
    return this.request<Application[]>(`/volunteer/feed?${query.toString()}`);
  }

  async acceptTask(applicationId: number): Promise<{ message: string; assignment_id: number }> {
    return this.request<{ message: string; assignment_id: number }>(`/volunteer/tasks/${applicationId}/accept`, {
      method: 'POST',
    });
  }

  async getMyTasks(): Promise<TaskAssignment[]> {
    return this.request<TaskAssignment[]>('/volunteer/my-tasks');
  }

  async submitReport(assignmentId: number, formData: FormData): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/volunteer/tasks/${assignmentId}/submit`, {
      method: 'POST',
      body: formData,
    });
  }

  async getChat(applicationId: number): Promise<TaskMessage[]> {
    return this.request<TaskMessage[]>(`/volunteer/chat/${applicationId}`);
  }

  async sendMessage(applicationId: number, message: string): Promise<TaskMessage> {
    return this.request<TaskMessage>(`/volunteer/chat/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getCertificates(): Promise<Certificate[]> {
    return this.request<Certificate[]>('/volunteer/certificates');
  }

  async downloadPracticePdf(): Promise<Blob> {
    return this.request<Blob>('/volunteer/profile/practice-pdf');
  }

  async downloadCertificatePdf(certId: number): Promise<Blob> {
    return this.request<Blob>(`/volunteer/certificates/${certId}/pdf`);
  }

  // --- Admin / Inspector ---
  async getKanban(): Promise<{
    new: Application[];
    approved: Application[];
    in_progress: Application[];
    review: Application[];
    completed: Application[];
  }> {
    return this.request('/admin/kanban');
  }

  async updateApplicationStatus(id: number, status: string): Promise<{ message: string }> {
    return this.request(`/admin/applications/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async assignVolunteer(applicationId: number, volunteerId: number): Promise<{ message: string }> {
    return this.request(`/admin/applications/${applicationId}/assign-volunteer`, {
      method: 'POST',
      body: JSON.stringify({ volunteer_id: volunteerId }),
    });
  }

  async getVerificationDetails(assignmentId: number): Promise<any> {
    return this.request(`/admin/verification/${assignmentId}`);
  }

  async verifyReport(assignmentId: number, data: { action: 'approve' | 'reject'; hours: number; inspector_comment?: string }): Promise<any> {
    return this.request(`/admin/verification/${assignmentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVolunteers(): Promise<any[]> {
    return this.request('/admin/volunteers');
  }

  async toggleVolunteerStatus(volunteerId: number): Promise<{ message: string }> {
    return this.request(`/admin/volunteers/${volunteerId}/toggle-status`, {
      method: 'POST',
    });
  }

  async issueCertificate(volunteerId: number, title?: string, description?: string): Promise<any> {
    return this.request(`/admin/volunteers/${volunteerId}/issue-certificate`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  // --- Analytics ---
  async getDashboard(): Promise<AnalyticsDashboard> {
    return this.request<AnalyticsDashboard>('/analytics/dashboard');
  }

  async getHeatmapPoints(): Promise<Array<{ lat: number; lng: number; weight: number; uin: string; is_emergency: boolean; district: string; address: string; category: string }>> {
    return this.request('/analytics/heatmap-points');
  }

  async exportExcel(): Promise<Blob> {
    return this.request<Blob>('/analytics/export-excel');
  }
}

export const api = new ApiClient();
