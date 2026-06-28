import axiosClient from '../api/axiosClient';
import { Notice } from '../types/common.types';

export const noticeService = {
  getNotices: async (): Promise<Notice[]> => {
    const response = await axiosClient.get<Notice[]>('notices');
    return response.data;
  },

  createNotice: async (notice: { title: string; content: string; category: string; isPublished: boolean }): Promise<Notice> => {
    const response = await axiosClient.post<Notice>('notices', notice);
    return response.data;
  },
};
