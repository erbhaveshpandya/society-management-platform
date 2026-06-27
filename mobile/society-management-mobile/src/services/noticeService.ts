import axiosClient from '../api/axiosClient';
import { Notice } from '../types/common.types';

export const noticeService = {
  getNotices: async (): Promise<Notice[]> => {
    const response = await axiosClient.get<Notice[]>('notices');
    return response.data;
  },
};
