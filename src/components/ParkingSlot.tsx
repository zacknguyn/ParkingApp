import type React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ParkingSlot as ParkingSlotType } from "../types";
import { parkingService } from "../services/parkingService";
import { pricingService } from "../services/pricingService";
import { authService, type UserProfile } from "../services/authService";

interface ParkingSlotProps {
  slot: ParkingSlotType;
  onUpdate: () => void;
  userProfile: UserProfile | null;
  onBalanceUpdate?: (newBalance: number) => void;
  isAdmin?: boolean;
}

export const ParkingSlot: React.FC<ParkingSlotProps> = ({
  slot,
  onUpdate,
  userProfile,
  onBalanceUpdate,
  isAdmin = false,
}) => {
  const handleAction = async () => {
    if (!userProfile) return;

    if (slot.occupied) {
      // Only users can pay to exit, not admins
      if (isAdmin) {
        Alert.alert(
          "Admin Notice",
          "As an admin, you cannot pay for parking. Use the admin panel to manage slots."
        );
        return;
      }

      // Check if this slot belongs to the current user
      if (slot.userId !== userProfile.uid) {
        Alert.alert("Error", "You can only pay for your own parking sessions.");
        return;
      }

      // Calculate parking fee
      const fee = pricingService.calculateParkingFee(slot.entryTime!);
      const duration = pricingService.formatDuration(slot.entryTime!);

      Alert.alert(
        "End Parking Session",
        `Duration: ${duration}\nFee: ${pricingService.formatCurrency(
          fee
        )}\n\nConfirm payment and mark slot as available?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Pay & Exit",
            onPress: async () => {
              try {
                // Check if user has sufficient balance
                if (userProfile.balance < fee) {
                  Alert.alert(
                    "Insufficient Balance",
                    "Please add funds to your account before exiting."
                  );
                  return;
                }

                // Deduct fee from user balance
                const newBalance = await authService.deductFunds(
                  userProfile.uid,
                  fee
                );
                if (onBalanceUpdate) {
                  onBalanceUpdate(newBalance);
                }

                // Mark slot as available
                await parkingService.markSlotAvailable(slot.id);
                onUpdate();

                Alert.alert(
                  "Payment Successful",
                  `${pricingService.formatCurrency(
                    fee
                  )} has been deducted from your account.\nRemaining balance: ${pricingService.formatCurrency(
                    newBalance
                  )}`
                );
              } catch (error: any) {
                if (error.message === "Insufficient balance") {
                  Alert.alert(
                    "Insufficient Balance",
                    "Please add funds to your account before exiting."
                  );
                } else {
                  Alert.alert("Error", "Failed to process payment");
                }
              }
            },
          },
        ]
      );
    }
  };

  const handleAdminAction = async () => {
    if (!isAdmin) return;

    // Get user info for display
    let userInfo = "Unknown User";
    if (slot.userId) {
      try {
        const slotUser = await authService.getUserProfile(slot.userId);
        if (slotUser) {
          userInfo = `${slotUser.displayName} (${slotUser.email})`;
        }
      } catch (error) {
        console.error("Error getting user info:", error);
      }
    }

    Alert.alert(
      "Admin Actions",
      `Slot ${slot.slotNumber}\nAssigned to: ${userInfo}\n\nWhat would you like to do?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Available",
          onPress: async () => {
            try {
              await parkingService.markSlotAvailable(slot.id);
              onUpdate();
              Alert.alert("Success", "Slot marked as available");
            } catch (error) {
              Alert.alert("Error", "Failed to update slot");
            }
          },
        },
      ]
    );
  };

  const currentFee = slot.occupied
    ? pricingService.calculateParkingFee(slot.entryTime!)
    : 0;
  const currentDuration = slot.occupied
    ? pricingService.formatDuration(slot.entryTime!)
    : "";

  // Check if this slot belongs to the current user
  const isUserSlot = slot.userId === userProfile?.uid;

  return (
    <View
      style={[
        styles.container,
        slot.occupied ? styles.occupied : styles.available,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.slotInfo}>
          <Ionicons
            name="car-sport"
            size={24}
            color={slot.occupied ? "#DC2626" : "#16A34A"}
          />
          <Text style={styles.slotNumber}>Spot {slot.slotNumber}</Text>
        </View>
        <View
          style={[
            styles.status,
            slot.occupied ? styles.statusOccupied : styles.statusAvailable,
          ]}
        >
          <Ionicons
            name={slot.occupied ? "close-circle" : "checkmark-circle"}
            size={16}
            color={slot.occupied ? "#DC2626" : "#16A34A"}
          />
          <Text
            style={[
              styles.statusText,
              slot.occupied
                ? styles.statusTextOccupied
                : styles.statusTextAvailable,
            ]}
          >
            {slot.occupied ? "Occupied" : "Available"}
          </Text>
        </View>
      </View>

      {slot.occupied && (
        <View style={styles.vehicleInfo}>
          <View style={styles.licensePlateContainer}>
            <Ionicons name="document-text" size={16} color="#374151" />
            <Text style={styles.licensePlate}>{slot.vehiclePlate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color="#64748B" />
            <Text style={styles.detailText}>Entry: {slot.entryTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="timer" size={14} color="#64748B" />
            <Text style={styles.detailText}>Duration: {currentDuration}</Text>
          </View>
          {slot.vehicleType && (
            <View style={styles.detailRow}>
              <Ionicons name="car" size={14} color="#64748B" />
              <Text style={styles.detailText}>Type: {slot.vehicleType}</Text>
            </View>
          )}
          <View style={styles.feeContainer}>
            <Ionicons name="cash" size={16} color="#2563EB" />
            <Text style={styles.feeText}>
              Current Fee: {pricingService.formatCurrency(currentFee)}
            </Text>
          </View>
        </View>
      )}

      {slot.occupied && (
        <>
          {/* User action button - only for their own slots */}
          {!isAdmin && isUserSlot && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAction}
            >
              <Ionicons name="card" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Pay & Exit</Text>
            </TouchableOpacity>
          )}

          {/* Admin action button */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleAdminAction}
            >
              <Ionicons name="settings" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Admin Actions</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  occupied: {
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  available: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#BBF7D0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 8,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOccupied: {
    backgroundColor: "#FEE2E2",
  },
  statusAvailable: {
    backgroundColor: "#DCFCE7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusTextOccupied: {
    color: "#DC2626",
  },
  statusTextAvailable: {
    color: "#16A34A",
  },
  vehicleInfo: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  licensePlateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 8,
    fontFamily: "monospace",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 6,
  },
  feeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  feeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 6,
  },
  actionButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  adminButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
