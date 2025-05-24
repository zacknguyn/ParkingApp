export interface ParkingSlot {
  id: string;
  slotNumber: number;
  vehiclePlate?: string;
  entryTime?: string;
  occupied: boolean;
  vehicleType?: string;
  imageUrl?: string;
  userId?: string; // Add user ID to track ownership
}

export interface VehicleData {
  licensePlate: string;
  vehicleType: string;
  slotNumber: string;
  entryTime: string;
}

export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route?: {
    params?: any;
  };
}
