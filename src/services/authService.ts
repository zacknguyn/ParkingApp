import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db, handleFirebaseError } from "../config/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: Date;
  balance: number;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

class AuthService {
  private readonly USERS_COLLECTION = "users";
  private authStateListener: (() => void) | null = null;
  private isAuthReady = false;

  // Wait for auth to be ready
  async waitForAuth(): Promise<void> {
    if (this.isAuthReady) return;

    return new Promise((resolve) => {
      // Simple timeout to ensure Firebase is initialized
      setTimeout(() => {
        this.isAuthReady = true;
        resolve();
      }, 100);
    });
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Find user by email address
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(db, this.USERS_COLLECTION);
      const q = query(
        usersRef,
        where("email", "==", email.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Get the first matching user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
      } as UserProfile;
    } catch (error: any) {
      console.error("Error finding user by email:", error);
      return null;
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserProfile> {
    try {
      console.log("Creating user account...");

      // Ensure auth is ready
      await this.waitForAuth();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("User created, updating profile...");

      // Update the user's display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!.toLowerCase(), // Store email in lowercase for consistent querying
        displayName,
        role: "user", // Default role is user
        createdAt: new Date(),
        balance: 0, // Starting balance
      };

      console.log("Saving user profile to Firestore...");
      await setDoc(doc(db, this.USERS_COLLECTION, user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
      });

      console.log("User account created successfully");
      return userProfile;
    } catch (error: any) {
      console.error("Error signing up:", error);
      handleFirebaseError(error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      console.log("Signing in user...");

      // Ensure auth is ready
      await this.waitForAuth();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("Getting user profile...");
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      console.log("Sign in successful");
      return userProfile;
    } catch (error: any) {
      console.error("Error signing in:", error);
      handleFirebaseError(error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log("Signing out user...");
      await signOut(auth);
      console.log("Sign out successful");
    } catch (error: any) {
      console.error("Error signing out:", error);
      handleFirebaseError(error);
      throw error;
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, this.USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as UserProfile;
      }

      return null;
    } catch (error: any) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  async updateUserBalance(uid: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        balance: amount,
      });
    } catch (error: any) {
      console.error("Error updating user balance:", error);
      throw error;
    }
  }

  async addFunds(uid: string, amount: number): Promise<number> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      const newBalance = userProfile.balance + amount;
      await this.updateUserBalance(uid, newBalance);
      return newBalance;
    } catch (error: any) {
      console.error("Error adding funds:", error);
      throw error;
    }
  }

  async deductFunds(uid: string, amount: number): Promise<number> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      if (userProfile.balance < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = userProfile.balance - amount;
      await this.updateUserBalance(uid, newBalance);
      return newBalance;
    } catch (error: any) {
      console.error("Error deducting funds:", error);
      throw error;
    }
  }

  onAuthStateChanged(callback: (authState: AuthState) => void): () => void {
    console.log("Setting up auth state listener...");

    // Clean up any existing listener
    if (this.authStateListener) {
      this.authStateListener();
    }

    // Wait a bit before setting up the listener
    setTimeout(() => {
      this.authStateListener = onAuthStateChanged(auth, async (user) => {
        console.log(
          "Auth state changed:",
          user ? "User logged in" : "User logged out"
        );

        if (user) {
          try {
            const profile = await this.getUserProfile(user.uid);
            callback({ user, profile, loading: false });
          } catch (error) {
            console.error("Error getting user profile:", error);
            callback({ user, profile: null, loading: false });
          }
        } else {
          callback({ user: null, profile: null, loading: false });
        }
      });
    }, 200);

    return () => {
      if (this.authStateListener) {
        this.authStateListener();
      }
    };
  }
}

export const authService = new AuthService();
