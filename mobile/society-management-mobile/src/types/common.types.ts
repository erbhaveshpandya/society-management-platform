export interface Notice {
  id: number;
  societyId: number;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  publishedDate: string;
  createdByName?: string;
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

// --- Maintenance / Dues ---
export interface Invoice {
  id: number;
  societyId: number;
  flatId: number;
  flatNumber: string;
  buildingName: string;
  ownerName: string;
  amount: number;
  description: string;
  billingMonth: string;
  dueDate: string;
  generatedDate: string;
  status: string;
  payment?: Payment;
}

export interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  transactionRef: string;
  receiptNumber: string;
}

// --- Polls ---
export interface Poll {
  id: number;
  societyId: number;
  question: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName: string;
  totalVotes: number;
  hasUserVoted: boolean;
  votedOptionId?: number | null;
  options: PollOption[];
  votes: PollVote[];
}

export interface PollOption {
  id: number;
  optionText: string;
  voteCount: number;
  percentage: number;
}

export interface PollVote {
  id: number;
  voterName: string;
  voterRole: string;
  flatNumber: string;
  buildingName: string;
  chosenOptionText: string;
  votedAt: string;
}

// --- Amenities ---
export interface Amenity {
  id: number;
  societyId: number;
  name: string;
  description: string;
  location: string;
  isActive: boolean;
  openTime: string;
  closeTime: string;
}

export interface Booking {
  id: number;
  amenityId: number;
  amenityName: string;
  residentId: number;
  residentName: string;
  flatNumber: string;
  bookingDate: string;
  timeSlot: string;
  purpose: string;
  status: string;
  createdAt: string;
}

export interface OccupiedSlot {
  amenityId: number;
  bookingDate: string;
  timeSlot: string;
}

// --- Staff ---
export interface Staff {
  id: number;
  societyId: number;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  isCheckedIn: boolean;
  lastCheckIn?: string | null;
  lastCheckOut?: string | null;
}

export interface StaffAttendance {
  id: number;
  staffId: number;
  staffName: string;
  staffRole: string;
  checkInTime: string;
  checkOutTime?: string | null;
  markedByName: string;
}

// --- Parking ---
export interface ParkingAlert {
  id: number;
  vehicleNumber: string;
  location: string;
  description: string;
  reportedByName: string;
  reportedAt: string;
  isResolved: boolean;
}

// --- Vehicles ---
export interface Vehicle {
  id: number;
  vehicleNumber: string;
  type: string;
  make: string;
  model: string;
}
