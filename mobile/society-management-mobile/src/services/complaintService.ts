import axiosClient from '../api/axiosClient';
import { Complaint, CreateComplaintRequest } from '../types/complaint.types';

export const complaintService = {
  getComplaints: async (status?: string): Promise<Complaint[]> => {
    const params = status ? { status } : {};
    const response = await axiosClient.get<Complaint[]>('complaints', { params });
    return response.data;
  },

  createComplaint: async (data: CreateComplaintRequest): Promise<Complaint> => {
    const response = await axiosClient.post<Complaint>('complaints', data);
    return response.data;
  },

  addComment: async (complaintId: number, comment: string): Promise<void> => {
    await axiosClient.post(`complaints/${complaintId}/comments`, { comment });
  },

  updateComplaintStatus: async (complaintId: number, status: string): Promise<void> => {
    await axiosClient.put(`complaints/${complaintId}/status`, { status });
  },
};
