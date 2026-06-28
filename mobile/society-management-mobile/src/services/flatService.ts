import axiosClient from '../api/axiosClient';
import { FlatDto, Building } from '../types/common.types';

export const flatService = {
  getAllFlats: async (): Promise<FlatDto[]> => {
    const res = await axiosClient.get<FlatDto[]>('flats');
    return res.data;
  },

  getBuildings: async (): Promise<Building[]> => {
    const res = await axiosClient.get<Building[]>('buildings');
    return res.data;
  },
};
