export interface Notice {
  id: number;
  societyId: number;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  publishedDate: string;
  createdBy: number;
  creatorName?: string;
}

export interface ResidentDashboard {
  totalDues: number;
  openComplaints: number;
  activeBookings: number;
  unreadNotifications: number;
  flatNumber: string;
  buildingName: string;
  recentNotices: RecentNotice[];
}

export interface RecentNotice {
  id: number;
  title: string;
  category: string;
  publishedDate: string;
}

export interface SecurityDashboard {
  activeVisitors: number;
  todayVisitors: number;
  staffCheckedIn: number;
  parkingAlerts: number;
  emergencyAlerts: number;
}

export interface EmergencyAlert {
  id: number;
  type: string;
  description: string;
  reportedByName: string;
  reportedByRole?: string;
  flatNumber?: string;
  buildingName?: string;
  reportedAt: string;
  isResolved: boolean;
}
