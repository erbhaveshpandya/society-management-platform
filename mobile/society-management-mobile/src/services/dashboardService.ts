import axiosClient from '../api/axiosClient';
import { ResidentDashboard, SecurityDashboard, AdminDashboard } from '../types/common.types';

export const dashboardService = {
  getResidentDashboard: async (): Promise<ResidentDashboard> => {
    const response = await axiosClient.get<ResidentDashboard>('dashboard/resident');
    return response.data;
  },

  getSecurityDashboard: async (): Promise<SecurityDashboard> => {
    const response = await axiosClient.get<SecurityDashboard>('dashboard/security');
    return response.data;
  },

  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const response = await axiosClient.get<AdminDashboard>('dashboard/admin');
    return response.data;
  },
};
