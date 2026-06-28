import axiosClient from '../api/axiosClient';
import { Poll } from '../types/common.types';

export const pollService = {
  getPolls: async (): Promise<Poll[]> => {
    const res = await axiosClient.get<Poll[]>('polls');
    return res.data;
  },

  vote: async (pollId: number, pollOptionId: number): Promise<void> => {
    await axiosClient.post(`polls/${pollId}/vote`, { pollOptionId });
  },
};
