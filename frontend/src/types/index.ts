export type Role = 'guest' | 'volunteer' | 'inspector' | 'director';

export interface District {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface Category {
  id: number;
  title: string;
  icon: string;
}

export interface User {
  id: number;
  full_name: string;
  phone: string;
  role: Role;
  status: 'pending' | 'active' | 'blocked';
  rating: number;
  volunteer_hours: number;
  district_id?: number;
  district?: District;
  created_at: string;
}

export interface Application {
  id: number;
  uin: string;
  applicant_name: string;
  phone: string;
  is_third_party: boolean;
  third_party_info?: string;
  benefit_category: string;
  district_id: number;
  district_name?: string;
  district?: District;
  address: string;
  category_id: number;
  category_title?: string;
  category_icon?: string;
  description: string;
  audio_url?: string;
  is_emergency: boolean;
  status: 'new' | 'approved' | 'in_progress' | 'review' | 'completed' | 'rejected';
  required_volunteers: number;
  assigned_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  volunteers?: Array<{
    assignment_id: number;
    volunteer_id: number;
    full_name: string;
    phone: string;
    status: string;
    photo_before_url?: string;
    photo_after_url?: string;
  }>;
}

export interface TaskAssignment {
  assignment_id: number;
  status: 'accepted' | 'submitted' | 'verified' | 'rejected';
  hours_awarded: number;
  photo_before_url?: string;
  photo_after_url?: string;
  volunteer_comment?: string;
  inspector_comment?: string;
  assigned_at: string;
  completed_at?: string;
  application: {
    id: number;
    uin: string;
    applicant_name: string;
    phone: string;
    benefit_category: string;
    district_name: string;
    address: string;
    category_title: string;
    description: string;
    audio_url?: string;
    is_emergency: boolean;
    status: string;
  };
}

export interface TaskMessage {
  id: number;
  application_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
  sender_role: string;
}

export interface Certificate {
  id: number;
  title: string;
  description: string;
  certificate_code: string;
  issued_at: string;
}

export interface WarmingPoint {
  id: number;
  name: string;
  address: string;
  district_name: string;
  description?: string;
  phone?: string;
  operating_hours: string;
  lat: number;
  lng: number;
  capacity: number;
}

export interface SummaryStats {
  completed_count: number;
  volunteers_count: number;
  districts_count: number;
  total_applications: number;
}

export interface AnalyticsDashboard {
  summary: {
    total_applications: number;
    completed_applications: number;
    in_progress_applications: number;
    emergency_applications: number;
    total_volunteers: number;
    active_volunteers: number;
    total_volunteer_hours: number;
    districts_covered: number;
  };
  district_stats: Array<{
    district_id: number;
    district_name: string;
    total_applications: number;
    completed_applications: number;
    emergency_count: number;
    lat: number;
    lng: number;
  }>;
  category_stats: Array<{
    category_id: number;
    category_title: string;
    count: number;
    percentage: number;
  }>;
  benefit_stats: Array<{
    category: string;
    count: number;
  }>;
  dynamics: Array<{
    date: string;
    total: number;
    completed: number;
    emergency: number;
  }>;
}

export interface TrackData {
  uin: string;
  benefit_category: string;
  district_name: string;
  category_title: string;
  status: string;
  is_emergency: boolean;
  created_at: string;
  status_history: Array<{
    status: string;
    label: string;
    completed: boolean;
    date: string;
  }>;
  anonymized_address: string;
}
