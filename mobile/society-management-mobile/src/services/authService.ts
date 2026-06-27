import axiosClient from '../api/axiosClient';
import { LoginResponse } from '../types/auth.types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('auth/login', { email, password });
    return response.data;
  },
};
