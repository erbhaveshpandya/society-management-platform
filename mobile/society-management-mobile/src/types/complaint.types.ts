export interface Complaint {
  id: number;
  societyId: number;
  flatId: number;
  flatNumber: string;
  residentId: number;
  residentName: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string | null;
  comments?: ComplaintComment[];
}

export interface ComplaintComment {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  comment: string;
  createdAt: string;
}

export interface CreateComplaintRequest {
  flatId: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
}
