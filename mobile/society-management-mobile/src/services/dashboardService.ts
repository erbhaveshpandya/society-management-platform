import axiosClient from '../api/axiosClient';
import { ResidentDashboard, SecurityDashboard } from '../types/common.types';

export const dashboardService = {
  getResidentDashboard: async (): Promise<ResidentDashboard> => {
    const response = await axiosClient.get<ResidentDashboard>('dashboard/resident');
    return response.data;
  },

  getSecurityDashboard: async (): Promise<SecurityDashboard> => {
    const response = await axiosClient.get<SecurityDashboard>('dashboard/security');
    return response.data;
  },
};
