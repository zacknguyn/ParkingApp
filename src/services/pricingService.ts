import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface PricingConfig {
  id: string;
  hourlyRate: number; // Price per hour
  minimumCharge: number; // Minimum charge (e.g., for first 30 minutes)
  currency: string;
  updatedAt: Date;
  updatedBy: string;
}

class PricingService {
  private readonly PRICING_COLLECTION = "pricing";
  private readonly DEFAULT_PRICING_ID = "default";

  async getPricingConfig(): Promise<PricingConfig> {
    try {
      const docRef = doc(db, this.PRICING_COLLECTION, this.DEFAULT_PRICING_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PricingConfig;
      } else {
        // Create default pricing if it doesn't exist
        const defaultPricing: PricingConfig = {
          id: this.DEFAULT_PRICING_ID,
          hourlyRate: 5.0, // $5 per hour
          minimumCharge: 2.0, // $2 minimum
          currency: "USD",
          updatedAt: new Date(),
          updatedBy: "system",
        };

        await setDoc(docRef, {
          ...defaultPricing,
          updatedAt: serverTimestamp(),
        });

        return defaultPricing;
      }
    } catch (error) {
      console.error("Error getting pricing config:", error);
      // Return default values if error
      return {
        id: this.DEFAULT_PRICING_ID,
        hourlyRate: 5.0,
        minimumCharge: 2.0,
        currency: "USD",
        updatedAt: new Date(),
        updatedBy: "system",
      };
    }
  }

  async updatePricingConfig(
    hourlyRate: number,
    minimumCharge: number,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.PRICING_COLLECTION, this.DEFAULT_PRICING_ID);
      await updateDoc(docRef, {
        hourlyRate,
        minimumCharge,
        updatedAt: serverTimestamp(),
        updatedBy,
      });
    } catch (error) {
      console.error("Error updating pricing config:", error);
      throw error;
    }
  }

  calculateParkingFee(entryTime: string, exitTime?: string): number {
    try {
      const entry = this.parseTimeString(entryTime);
      const exit = exitTime ? this.parseTimeString(exitTime) : new Date();

      const durationMs = exit.getTime() - entry.getTime();
      const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours

      // For demo purposes, use default rates
      const hourlyRate = 5.0;
      const minimumCharge = 2.0;

      const calculatedFee = durationHours * hourlyRate;
      return Math.max(calculatedFee, minimumCharge);
    } catch (error) {
      console.error("Error calculating parking fee:", error);
      return 2.0; // Return minimum charge on error
    }
  }

  private parseTimeString(timeString: string): Date {
    // Handle different time formats
    const today = new Date();
    const [time, period] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let hour24 = hours;
    if (period?.toLowerCase() === "pm" && hours !== 12) {
      hour24 += 12;
    } else if (period?.toLowerCase() === "am" && hours === 12) {
      hour24 = 0;
    }

    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hour24,
      minutes
    );
    return date;
  }

  formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  formatDuration(entryTime: string, exitTime?: string): string {
    try {
      const entry = this.parseTimeString(entryTime);
      const exit = exitTime ? this.parseTimeString(exitTime) : new Date();

      const durationMs = exit.getTime() - entry.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      return "0m";
    }
  }
}

export const pricingService = new PricingService();
