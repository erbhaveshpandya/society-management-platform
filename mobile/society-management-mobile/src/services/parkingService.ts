import axiosClient from '../api/axiosClient';
import { ParkingAlert } from '../types/common.types';

export const parkingService = {
  getAlerts: async (): Promise<ParkingAlert[]> => {
    const res = await axiosClient.get<ParkingAlert[]>('parking-alerts');
    return res.data;
  },

  reportAlert: async (vehicleNumber: string, location: string, description: string): Promise<void> => {
    await axiosClient.post('parking-alerts', { vehicleNumber, location, description });
  },

  resolveAlert: async (id: number): Promise<void> => {
    await axiosClient.post(`parking-alerts/${id}/resolve`);
  },
};
