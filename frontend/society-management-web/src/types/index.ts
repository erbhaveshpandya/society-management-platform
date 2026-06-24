export type UserRole = 'SuperAdmin' | 'SocietyAdmin' | 'Resident' | 'SecurityGuard';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  societyId: number | null;
  societyName: string | null;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  userId: number;
  societyId: number | null;
  societyName: string | null;
  expiration: string;
  permissions: string[];
}

export interface Society {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  registrationNumber: string;
  contactPhone: string;
  contactEmail: string;
}

export interface Building {
  id: number;
  societyId: number;
  name: string;
  totalFloors: number;
  description?: string;
}

export interface Flat {
  id: number;
  societyId: number;
  buildingId: number;
  flatNumber: string;
  floor: number;
  type: string;
  area: number;
  ownerId?: number | null;
  isOccupied: boolean;
  ownerName?: string;
  buildingName?: string;
  residents?: any[];
}

export interface ResidentProfile {
  id: number;
  societyId: number;
  userId: number;
  flatId: number;
  residentType: 'Owner' | 'Tenant';
  moveInDate: string;
  fullName?: string;
  flatNumber?: string;
  email?: string;
  phone?: string;
}

export interface Vehicle {
  id: number;
  societyId: number;
  residentProfileId: number;
  vehicleNumber: string;
  type: 'Car' | 'Bike' | 'Other';
  make: string;
  model: string;
  ownerName?: string;
  flatNumber?: string;
}

export interface Vendor {
  id: number;
  societyId: number;
  name: string;
  contact: string;
  serviceType: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface MaintenanceInvoice {
  id: number;
  societyId: number;
  flatId: number;
  amount: number;
  description: string;
  billingMonth: string;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'PendingApproval';
  generatedDate: string;
  flatNumber?: string;
  ownerName?: string;
  payment?: Payment;
}

export interface Payment {
  id: number;
  societyId: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  method: 'Online' | 'Cash' | 'Cheque' | 'UPI';
  transactionRef: string;
  receiptNumber: string;
}

export interface Expense {
  id: number;
  societyId: number;
  category: string;
  amount: number;
  date: string;
  voucherNumber: string;
  vendorId?: number | null;
  description?: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  vendorName?: string;
}

export interface Complaint {
  id: number;
  societyId: number;
  flatId: number;
  residentId: number;
  subject: string;
  description: string;
  category: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  resolvedAt?: string | null;
  residentName?: string;
  flatNumber?: string;
  comments?: ComplaintComment[];
  attachments?: ComplaintAttachment[];
}

export interface ComplaintComment {
  id: number;
  complaintId: number;
  userId: number;
  comment: string;
  createdAt: string;
  userName?: string;
  userRole?: string;
}

export interface ComplaintAttachment {
  id: number;
  complaintId: number;
  fileName: string;
  filePath: string;
}

export interface Notice {
  id: number;
  societyId: number;
  title: string;
  content: string;
  category: 'General' | 'Maintenance' | 'Event' | 'Emergency';
  isPublished: boolean;
  publishedDate: string;
  createdBy: number;
  creatorName?: string;
}

export interface Poll {
  id: number;
  societyId: number;
  question: string;
  description: string;
  status: 'Active' | 'Closed';
  startDate: string;
  endDate: string;
  createdBy: number;
  creatorName?: string;
  options: PollOption[];
  hasVoted?: boolean;
  hasUserVoted?: boolean;
  votedOptionId?: number | null;
  totalVotes?: number;
}

export interface PollOption {
  id: number;
  pollId: number;
  optionText: string;
  voteCount: number;
}

export interface Amenity {
  id: number;
  societyId: number;
  name: string;
  description: string;
  location: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface AmenityBooking {
  id: number;
  societyId: number;
  amenityId: number;
  residentId: number;
  bookingDate: string;
  timeSlot: string;
  purpose: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Cancelled';
  createdAt: string;
  amenityName?: string;
  residentName?: string;
  flatNumber?: string;
}

export interface Staff {
  id: number;
  societyId: number;
  name: string;
  phone: string;
  role: string;
  photo?: string;
  isActive: boolean;
  address?: string;
  isCheckedIn?: boolean;
  lastCheckIn?: string | null;
  lastCheckOut?: string | null;
  attendanceRecords?: StaffAttendance[];
}

export interface StaffAttendance {
  id: number;
  staffId: number;
  societyId: number;
  checkInTime: string;
  checkOutTime?: string | null;
  markedBy: number;
  staffName?: string;
  staffRole?: string;
  markedByName?: string;
}

export interface VisitorLog {
  id: number;
  societyId: number;
  visitorName: string;
  phone: string;
  vehicleNumber?: string;
  flatId: number;
  purpose: string;
  entryTime: string;
  exitTime?: string | null;
  checkedInBy: number;
  isActive: boolean;
  flatNumber?: string;
  buildingName?: string;
  checkedInByName?: string;
}

export interface ParkingAlert {
  id: number;
  societyId: number;
  vehicleNumber: string;
  location: string;
  description: string;
  reportedBy: number;
  reportedAt: string;
  isResolved: boolean;
  reporterName?: string;
}

export interface EmergencyAlert {
  id: number;
  societyId: number;
  type: 'Fire' | 'Theft' | 'Medical' | 'SuspiciousActivity' | 'Other';
  description: string;
  reportedBy: number;
  reportedAt: string;
  isResolved: boolean;
  reporterName?: string;
}

export interface Notification {
  id: number;
  societyId: number;
  userId?: number | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  referenceUrl?: string;
}

export interface AuditLog {
  id: number;
  societyId?: number | null;
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details: string;
  ipAddress: string;
  timestamp: string;
  userName?: string;
}
