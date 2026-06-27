import axiosClient from '../api/axiosClient';
import { VisitorLog, CreateVisitorRequest, Flat } from '../types/visitor.types';

export const visitorService = {
  getVisitors: async (activeOnly?: boolean): Promise<VisitorLog[]> => {
    const params = activeOnly ? { activeOnly: true } : {};
    const response = await axiosClient.get<VisitorLog[]>('visitors', { params });
    return response.data;
  },

  createVisitor: async (data: CreateVisitorRequest): Promise<VisitorLog> => {
    const response = await axiosClient.post<VisitorLog>('visitors', data);
    return response.data;
  },

  checkoutVisitor: async (id: number): Promise<void> => {
    await axiosClient.post(`visitors/${id}/checkout`);
  },

  getFlats: async (): Promise<Flat[]> => {
    const response = await axiosClient.get<Flat[]>('flats');
    return response.data;
  },
};
