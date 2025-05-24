"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parkingService } from "../services/parkingService";
import { pricingService, type PricingConfig } from "../services/pricingService";
import type { UserProfile } from "../services/authService";

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  visible,
  onClose,
  userProfile,
}) => {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(
    null
  );
  const [newSlotNumber, setNewSlotNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [minimumCharge, setMinimumCharge] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPricingConfig();
    }
  }, [visible]);

  const loadPricingConfig = async () => {
    try {
      const config = await pricingService.getPricingConfig();
      setPricingConfig(config);
      setHourlyRate(config.hourlyRate.toString());
      setMinimumCharge(config.minimumCharge.toString());
    } catch (error) {
      Alert.alert("Error", "Failed to load pricing configuration");
    }
  };

  const handleAddSlot = async () => {
    if (!newSlotNumber.trim()) {
      Alert.alert("Error", "Please enter a slot number");
      return;
    }

    const slotNum = Number.parseInt(newSlotNumber);
    if (isNaN(slotNum) || slotNum <= 0) {
      Alert.alert("Error", "Please enter a valid slot number");
      return;
    }

    setLoading(true);
    try {
      // Add new slot logic would go here
      // For now, we'll just show a success message
      Alert.alert(
        "Success",
        `Slot ${slotNum} would be added (feature to be implemented)`
      );
      setNewSlotNumber("");
    } catch (error) {
      Alert.alert("Error", "Failed to add parking slot");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePricing = async () => {
    const hourlyRateNum = Number.parseFloat(hourlyRate);
    const minimumChargeNum = Number.parseFloat(minimumCharge);

    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      Alert.alert("Error", "Please enter a valid hourly rate");
      return;
    }

    if (isNaN(minimumChargeNum) || minimumChargeNum <= 0) {
      Alert.alert("Error", "Please enter a valid minimum charge");
      return;
    }

    setLoading(true);
    try {
      await pricingService.updatePricingConfig(
        hourlyRateNum,
        minimumChargeNum,
        userProfile.uid
      );
      await loadPricingConfig();
      Alert.alert("Success", "Pricing updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllSlots = async () => {
    Alert.alert(
      "Reset All Slots",
      "This will mark all parking slots as available. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await parkingService.resetAllSlots();
              Alert.alert("Success", "All parking slots have been reset");
            } catch (error) {
              Alert.alert("Error", "Failed to reset parking slots");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Admin Panel</Text>
              <Text style={styles.headerSubtitle}>Manage parking system</Text>
            </View>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Pricing Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Configuration</Text>
            <View style={styles.sectionContent}>
              <View style={styles.field}>
                <Text style={styles.label}>
                  Hourly Rate ({pricingConfig?.currency || "USD"})
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="cash"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="5.00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Minimum Charge ({pricingConfig?.currency || "USD"})
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="cash"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={minimumCharge}
                    onChangeText={setMinimumCharge}
                    placeholder="2.00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  loading && styles.actionButtonDisabled,
                ]}
                onPress={handleUpdatePricing}
                disabled={loading}
              >
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Update Pricing</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Slot Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Slot Management</Text>
            <View style={styles.sectionContent}>
              <View style={styles.field}>
                <Text style={styles.label}>Add New Parking Slot</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="location"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={newSlotNumber}
                    onChangeText={setNewSlotNumber}
                    placeholder="Enter slot number"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  loading && styles.actionButtonDisabled,
                ]}
                onPress={handleAddSlot}
                disabled={loading}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Add Slot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dangerButton,
                  loading && styles.actionButtonDisabled,
                ]}
                onPress={handleResetAllSlots}
                disabled={loading}
              >
                <Ionicons name="refresh-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Reset All Slots</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Configuration */}
          {pricingConfig && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Configuration</Text>
              <View style={styles.sectionContent}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Hourly Rate:</Text>
                  <Text style={styles.configValue}>
                    {pricingService.formatCurrency(
                      pricingConfig.hourlyRate,
                      pricingConfig.currency
                    )}
                  </Text>
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Minimum Charge:</Text>
                  <Text style={styles.configValue}>
                    {pricingService.formatCurrency(
                      pricingConfig.minimumCharge,
                      pricingConfig.currency
                    )}
                  </Text>
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Last Updated:</Text>
                  <Text style={styles.configValue}>
                    {pricingConfig.updatedAt.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  actionButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  configItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  configLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  configValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
});
