import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { storage } from "../config/firebase";

export interface StoredImage {
  id: string;
  url: string;
  name: string;
  timestamp: Date;
  licensePlate?: string;
  vehicleType?: string;
  slotNumber?: string;
}

class StorageService {
  private readonly IMAGES_PATH = "license-plates";

  async uploadImage(
    imageUri: string,
    metadata: {
      licensePlate: string;
      vehicleType: string;
      slotNumber: string;
    }
  ): Promise<string> {
    try {
      // Create a unique filename
      const timestamp = new Date().toISOString();
      const filename = `${metadata.licensePlate}_${metadata.slotNumber}_${timestamp}.jpg`;
      const imageRef = ref(storage, `${this.IMAGES_PATH}/${filename}`);

      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Add custom metadata
      const customMetadata = {
        customMetadata: {
          licensePlate: metadata.licensePlate,
          vehicleType: metadata.vehicleType,
          slotNumber: metadata.slotNumber,
          timestamp: timestamp,
        },
      };

      // Upload the image
      await uploadBytes(imageRef, blob, customMetadata);

      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      console.log("Image uploaded successfully:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async getAllImages(): Promise<StoredImage[]> {
    try {
      const imagesRef = ref(storage, this.IMAGES_PATH);
      const result = await listAll(imagesRef);

      const images: StoredImage[] = [];

      for (const itemRef of result.items) {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);

          images.push({
            id: itemRef.name,
            url: url,
            name: itemRef.name,
            timestamp: new Date(metadata.timeCreated),
            licensePlate: metadata.customMetadata?.licensePlate,
            vehicleType: metadata.customMetadata?.vehicleType,
            slotNumber: metadata.customMetadata?.slotNumber,
          });
        } catch (error) {
          console.error("Error getting image metadata:", error);
        }
      }

      // Sort by timestamp (newest first)
      return images.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    }
  }

  async deleteImage(imageName: string): Promise<void> {
    try {
      const imageRef = ref(storage, `${this.IMAGES_PATH}/${imageName}`);
      await deleteObject(imageRef);
      console.log("Image deleted successfully:", imageName);
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  }

  async deleteAllImages(): Promise<void> {
    try {
      const imagesRef = ref(storage, this.IMAGES_PATH);
      const result = await listAll(imagesRef);

      const deletePromises = result.items.map((itemRef) =>
        deleteObject(itemRef)
      );
      await Promise.all(deletePromises);

      console.log("All images deleted successfully");
    } catch (error) {
      console.error("Error deleting all images:", error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
