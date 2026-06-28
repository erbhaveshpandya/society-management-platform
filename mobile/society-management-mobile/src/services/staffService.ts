import axiosClient from '../api/axiosClient';
import { Staff, StaffAttendance } from '../types/common.types';

export const staffService = {
  getAll: async (): Promise<Staff[]> => {
    const res = await axiosClient.get<Staff[]>('staff');
    return res.data;
  },

  checkIn: async (staffId: number): Promise<void> => {
    await axiosClient.post(`staff/${staffId}/checkin`);
  },

  checkOut: async (staffId: number): Promise<void> => {
    await axiosClient.post(`staff/${staffId}/checkout`);
  },

  getAttendance: async (date?: string): Promise<StaffAttendance[]> => {
    const params = date ? `?date=${date}` : '';
    const res = await axiosClient.get<StaffAttendance[]>(`staff/attendance${params}`);
    return res.data;
  },
};
