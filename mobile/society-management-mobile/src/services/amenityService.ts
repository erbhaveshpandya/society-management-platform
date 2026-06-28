import axiosClient from '../api/axiosClient';
import { Amenity, Booking, OccupiedSlot } from '../types/common.types';

export const amenityService = {
  getAmenities: async (): Promise<Amenity[]> => {
    const res = await axiosClient.get<Amenity[]>('amenities');
    return res.data;
  },

  getBookings: async (): Promise<Booking[]> => {
    const res = await axiosClient.get<Booking[]>('bookings');
    return res.data;
  },

  getOccupiedSlots: async (): Promise<OccupiedSlot[]> => {
    const res = await axiosClient.get<OccupiedSlot[]>('bookings/occupied');
    return res.data;
  },

  createBooking: async (amenityId: number, bookingDate: string, timeSlot: string, purpose: string): Promise<void> => {
    await axiosClient.post('bookings', { amenityId, bookingDate, timeSlot, purpose });
  },
};
