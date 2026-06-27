export interface VisitorLog {
  id: number;
  societyId: number;
  visitorName: string;
  phone: string;
  vehicleNumber: string;
  flatId: number;
  flatNumber: string;
  purpose: string;
  entryTime: string;
  exitTime?: string | null;
  isActive: boolean;
  checkedInByName: string;
}

export interface CreateVisitorRequest {
  visitorName: string;
  phone: string;
  vehicleNumber: string;
  flatId: number;
  purpose: string;
}

export interface Flat {
  id: number;
  societyId: number;
  buildingId: number;
  flatNumber: string;
  floor: number;
  type: string;
  area: number;
  isOccupied: boolean;
  ownerName?: string;
  buildingName?: string;
}
