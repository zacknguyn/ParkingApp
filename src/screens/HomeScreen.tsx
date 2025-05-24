"use client";

import type React from "react";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ParkingSlot } from "../components/ParkingSlot";
import { StatusCard } from "../components/StatusCard";
import { UserBalance } from "../components/UserBalance";
import { AdminPanel } from "../components/AdminPanel";
import { parkingService } from "../services/parkingService";
import { authService, type UserProfile } from "../services/authService";
import type { ParkingSlot as ParkingSlotType, NavigationProps } from "../types";

interface HomeScreenProps extends NavigationProps {
  userProfile: UserProfile | null;
  onSignOut: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  userProfile,
  onSignOut,
}) => {
  const [parkingData, setParkingData] = useState<ParkingSlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(userProfile);

  const loadParkingData = async () => {
    try {
      const slots = await parkingService.getParkingSlots();

      // Filter slots based on user role
      if (currentUserProfile?.role === "user") {
        // Users only see their own occupied slots
        const userSlots = slots.filter(
          (slot) => slot.occupied && slot.userId === currentUserProfile.uid
        );
        setParkingData(userSlots);
      } else {
        // Admins see all slots
        setParkingData(slots);
      }
    } catch (error) {
      console.error("Failed to load parking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (userProfile) {
      const updatedProfile = await authService.getUserProfile(userProfile.uid);
      setCurrentUserProfile(updatedProfile);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadParkingData(), refreshUserProfile()]);
    setRefreshing(false);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    if (currentUserProfile) {
      setCurrentUserProfile({ ...currentUserProfile, balance: newBalance });
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadParkingData();
      refreshUserProfile();
    }, [userProfile])
  );

  const totalSpots = parkingData.length;
  const occupiedSpots = parkingData.filter((spot) => spot.occupied).length;
  const availableSpots = totalSpots - occupiedSpots;
  const occupancyRate =
    totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="car-sport" size={48} color="#2563EB" />
          <Text style={styles.loadingText}>Loading parking data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = currentUserProfile?.role === "admin";
  const isUser = currentUserProfile?.role === "user";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>
              Welcome, {currentUserProfile?.displayName || "User"}
              {isAdmin && <Text style={styles.adminBadge}> (Admin)</Text>}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isUser ? "Your parking sessions" : "Real-time parking status"}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowAdminPanel(true)}
                style={[
                  styles.refreshButton,
                  { marginRight: 8, backgroundColor: "#DC2626" },
                ]}
              >
                <Ionicons name="settings" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onSignOut}
              style={[styles.refreshButton, { marginRight: 8 }]}
            >
              <Ionicons name="log-out" size={24} color="#DC2626" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={refreshing ? "#94A3B8" : "#2563EB"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Balance - Only for users */}
        {isUser && currentUserProfile && (
          <UserBalance
            userProfile={currentUserProfile}
            onBalanceUpdate={handleBalanceUpdate}
          />
        )}

        {/* Stats Grid - Different for users vs admins */}
        {isAdmin && (
          <View style={styles.statsGrid}>
            <StatusCard
              label="Total Spots"
              value={totalSpots}
              backgroundColor="#DBEAFE"
              iconName="car-sport"
              iconColor="#2563EB"
            />
            <StatusCard
              label="Available"
              value={availableSpots}
              backgroundColor="#DCFCE7"
              textColor="#16A34A"
              iconName="checkmark-circle"
              iconColor="#16A34A"
            />
            <StatusCard
              label="Occupied"
              value={occupiedSpots}
              backgroundColor="#FEF2F2"
              textColor="#DC2626"
              iconName="close-circle"
              iconColor="#DC2626"
            />
            <StatusCard
              label="Occupancy"
              value={`${occupancyRate}%`}
              backgroundColor="#F3E8FF"
              textColor="#7C3AED"
              iconName="analytics"
              iconColor="#7C3AED"
            />
          </View>
        )}

        {/* Quick Actions - Only for admins */}
        {isAdmin && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Camera")}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Register Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Parking Slots */}
        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>
            {isUser ? "Your Parking Sessions" : "Parking Slots"}
          </Text>
          {isUser && parkingData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color="#64748B" />
              <Text style={styles.emptyTitle}>No Active Parking</Text>
              <Text style={styles.emptyMessage}>
                You don't have any active parking sessions
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>
                {isAdmin
                  ? `${availableSpots} of ${totalSpots} available`
                  : `${parkingData.length} active session${
                      parkingData.length !== 1 ? "s" : ""
                    }`}
              </Text>
              <View style={styles.slotsContainer}>
                {parkingData.map((slot) => (
                  <ParkingSlot
                    key={slot.id}
                    slot={slot}
                    onUpdate={loadParkingData}
                    userProfile={currentUserProfile}
                    onBalanceUpdate={handleBalanceUpdate}
                    isAdmin={isAdmin}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Admin Panel */}
      {isAdmin && (
        <AdminPanel
          visible={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          userProfile={currentUserProfile}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  adminBadge: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  slotsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  slotsContainer: {
    gap: 12,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
});
