import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { storageService } from "./storageService";
import type { ParkingSlot, VehicleData } from "../types";

class ParkingService {
  private readonly COLLECTION_NAME = "parkingSlots";

  async initializeParkingSlots(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));

      // If no documents exist, create initial parking slots
      if (querySnapshot.empty) {
        console.log("No parking slots found, initializing...");
        const batch = writeBatch(db);
        const mockData = this.getMockData();

        mockData.forEach((slot) => {
          const docRef = doc(db, this.COLLECTION_NAME, slot.id);
          batch.set(docRef, {
            slotNumber: slot.slotNumber,
            occupied: slot.occupied,
            vehiclePlate: slot.vehiclePlate || null,
            vehicleType: slot.vehicleType || null,
            entryTime: slot.entryTime || null,
            imageUrl: slot.imageUrl || null,
            userId: slot.userId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
        console.log("Parking slots initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing parking slots:", error);
    }
  }

  async getParkingSlots(): Promise<ParkingSlot[]> {
    try {
      // Initialize slots if they don't exist
      await this.initializeParkingSlots();

      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const slots = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingSlot[];

      return slots.length > 0
        ? slots.sort((a, b) => a.slotNumber - b.slotNumber)
        : this.getMockData();
    } catch (error) {
      console.error("Error fetching parking slots:", error);
      return this.getMockData();
    }
  }

  async getAvailableSlots(): Promise<ParkingSlot[]> {
    try {
      const allSlots = await this.getParkingSlots();
      return allSlots.filter((slot) => !slot.occupied);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      const mockData = this.getMockData();
      return mockData.filter((slot) => !slot.occupied);
    }
  }

  async registerVehicle(
    vehicleData: VehicleData,
    userId: string,
    imageUri?: string
  ): Promise<void> {
    try {
      // Get all slots to find the target slot
      const slots = await this.getParkingSlots();
      const targetSlot = slots.find(
        (slot) => slot.slotNumber.toString() === vehicleData.slotNumber
      );

      if (!targetSlot) {
        throw new Error("Parking slot not found");
      }

      if (targetSlot.occupied) {
        throw new Error("Parking slot is already occupied");
      }

      let imageUrl = null;

      // Upload image to storage if provided
      if (imageUri) {
        try {
          imageUrl = await storageService.uploadImage(imageUri, {
            licensePlate: vehicleData.licensePlate,
            vehicleType: vehicleData.vehicleType,
            slotNumber: vehicleData.slotNumber,
          });
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          // Continue without image if upload fails
        }
      }

      // Update the slot document
      const slotRef = doc(db, this.COLLECTION_NAME, targetSlot.id);

      const updateData = {
        occupied: true,
        vehiclePlate: vehicleData.licensePlate,
        vehicleType: vehicleData.vehicleType,
        entryTime: vehicleData.entryTime,
        imageUrl: imageUrl,
        userId: userId, // Associate slot with user
        updatedAt: serverTimestamp(),
      };

      // Check if document exists, if not create it
      try {
        await updateDoc(slotRef, updateData);
      } catch (updateError: any) {
        if (updateError.code === "not-found") {
          // Document doesn't exist, create it
          await setDoc(slotRef, {
            slotNumber: targetSlot.slotNumber,
            ...updateData,
            createdAt: serverTimestamp(),
          });
        } else {
          throw updateError;
        }
      }

      console.log("Vehicle registered successfully");
    } catch (error) {
      console.error("Error registering vehicle:", error);
      throw error;
    }
  }

  async markSlotAvailable(slotId: string): Promise<void> {
    try {
      const slotRef = doc(db, this.COLLECTION_NAME, slotId);

      try {
        await updateDoc(slotRef, {
          occupied: false,
          vehiclePlate: null,
          vehicleType: null,
          entryTime: null,
          imageUrl: null,
          userId: null, // Clear user association
          updatedAt: serverTimestamp(),
        });
      } catch (updateError: any) {
        if (updateError.code === "not-found") {
          throw new Error("Parking slot not found");
        } else {
          throw updateError;
        }
      }

      console.log("Slot marked as available");
    } catch (error) {
      console.error("Error marking slot as available:", error);
      throw error;
    }
  }

  // Reset all slots to available (useful for testing)
  async resetAllSlots(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((document) => {
        batch.update(document.ref, {
          occupied: false,
          vehiclePlate: null,
          vehicleType: null,
          entryTime: null,
          imageUrl: null,
          userId: null,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log("All slots reset successfully");
    } catch (error) {
      console.error("Error resetting slots:", error);
      throw error;
    }
  }

  private getMockData(): ParkingSlot[] {
    return [
      {
        id: "1",
        slotNumber: 1,
        occupied: true,
        vehiclePlate: "ABC123",
        vehicleType: "Sedan",
        entryTime: "09:30 AM",
        userId: "demo-user-1",
      },
      {
        id: "2",
        slotNumber: 2,
        occupied: false,
      },
      {
        id: "3",
        slotNumber: 3,
        occupied: true,
        vehiclePlate: "XYZ789",
        vehicleType: "SUV",
        entryTime: "10:15 AM",
        userId: "demo-user-2",
      },
      {
        id: "4",
        slotNumber: 4,
        occupied: false,
      },
      {
        id: "5",
        slotNumber: 5,
        occupied: false,
      },
      {
        id: "6",
        slotNumber: 6,
        occupied: true,
        vehiclePlate: "DEF456",
        vehicleType: "Truck",
        entryTime: "11:00 AM",
        userId: "demo-user-3",
      },
    ];
  }
}

export const parkingService = new ParkingService();
