import axiosClient from '../api/axiosClient';

export interface FlatWithVehicles {
  id: number;
  flatNumber: string;
  buildingName: string;
  ownerId?: string | null;
  residents?: Array<{
    userId: string;
    vehicles?: Array<{
      id: number;
      vehicleNumber: string;
      type: string;
      make: string;
      model: string;
    }>;
  }>;
}

export const vehicleService = {
  getMyVehicles: async (currentUserId: string): Promise<any[]> => {
    const res = await axiosClient.get<FlatWithVehicles[]>('flats');
    const myVehicles: any[] = [];
    
    res.data.forEach((flat) => {
      const isAssociated = flat.ownerId === currentUserId || 
        (flat.residents && flat.residents.some((r) => r.userId === currentUserId));
      
      if (isAssociated && flat.residents) {
        flat.residents.forEach((r) => {
          if (r.userId === currentUserId && r.vehicles) {
            r.vehicles.forEach((v) => {
              myVehicles.push({
                id: v.id,
                vehicleNumber: v.vehicleNumber,
                type: v.type,
                make: v.make,
                model: v.model,
                flatNumber: flat.flatNumber,
                buildingName: flat.buildingName,
              });
            });
          }
        });
      }
    });
    
    return myVehicles;
  },

  addVehicle: async (vehicleNumber: string, type: string, make: string, model: string): Promise<void> => {
    await axiosClient.post('flats/vehicles', {
      vehicleNumber,
      type,
      make,
      model,
    });
  },

  deleteVehicle: async (id: number): Promise<void> => {
    await axiosClient.delete(`flats/vehicles/${id}`);
  },
};
