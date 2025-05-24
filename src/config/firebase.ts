import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTUMutR_73f3GZy-26PW4dBLi7j3lpmB0",
  authDomain: "parkingmanagement-49da1.firebaseapp.com",
  projectId: "parkingmanagement-49da1",
  storageBucket: "parkingmanagement-49da1.firebasestorage.app",
  messagingSenderId: "433323124253",
  appId: "1:433323124253:web:0f205c5c4db4c100d648f4",
  measurementId: "G-PFB8JMNHS0",
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with default settings (simpler approach)
export const auth = getAuth(app);

// Initialize Firestore
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // For React Native
});

// Initialize Storage
export const storage = getStorage(app);

// Error handler for Firebase operations
export const handleFirebaseError = (error: any) => {
  console.error("Firebase error:", error);

  // Handle specific error cases
  switch (error.code) {
    case "permission-denied":
      console.error("Permission denied. Please check your security rules.");
      break;
    case "unavailable":
      console.error(
        "Service is currently unavailable. Please try again later."
      );
      break;
    case "failed-precondition":
      console.error("Operation failed due to a precondition.");
      break;
    default:
      console.error("An unexpected error occurred:", error.message);
  }

  throw error;
};

export default app;
