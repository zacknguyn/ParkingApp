"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parkingService } from "../services/parkingService";
import { authService } from "../services/authService";
import type { ParkingSlot } from "../types";

interface VehicleFormProps {
  imageUri: string;
  onReset: () => void;
  onSuccess: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  imageUri,
  onReset,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    licensePlate: "",
    vehicleType: "",
    slotNumber: "",
    userEmail: "", // Add user email field for admin assignment
  });
  const [availableSlots, setAvailableSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVehicleTypePicker, setShowVehicleTypePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  const vehicleTypes = [
    { label: "Sedan", value: "Sedan" },
    { label: "SUV", value: "SUV" },
    { label: "Truck", value: "Truck" },
    { label: "Motorcycle", value: "Motorcycle" },
    { label: "Van", value: "Van" },
  ];

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      const slots = await parkingService.getAvailableSlots();
      setAvailableSlots(slots);
    } catch (error) {
      Alert.alert("Error", "Failed to load available slots");
    }
  };

  const handleSubmit = async () => {
    if (!formData.licensePlate.trim()) {
      Alert.alert("Error", "Please enter a license plate number");
      return;
    }
    if (!formData.vehicleType) {
      Alert.alert("Error", "Please select a vehicle type");
      return;
    }
    if (!formData.slotNumber) {
      Alert.alert("Error", "Please select a parking slot");
      return;
    }
    if (!formData.userEmail.trim()) {
      Alert.alert("Error", "Please enter the user's email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const targetUser = await authService.getUserByEmail(
        formData.userEmail.trim()
      );
      if (!targetUser) {
        Alert.alert(
          "Error",
          "No user found with this email address. Please make sure the user has an account."
        );
        setLoading(false);
        return;
      }

      await parkingService.registerVehicle(
        {
          ...formData,
          entryTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        targetUser.uid, // Use the target user's ID
        imageUri // Pass the image URI to be uploaded
      );

      Alert.alert(
        "Success",
        `Vehicle registered successfully for ${targetUser.displayName} (${targetUser.email})!\nImage has been saved to storage.`,
        [{ text: "OK", onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message.includes("No user found")) {
        Alert.alert(
          "Error",
          "No user found with this email address. Please make sure the user has an account."
        );
      } else {
        Alert.alert("Error", "Failed to register vehicle. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const PickerModal = ({
    visible,
    onClose,
    title,
    items,
    selectedValue,
    onValueChange,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: { label: string; value: string }[];
    selectedValue: string;
    onValueChange: (value: string) => void;
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerContainer}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.pickerItem,
                  selectedValue === item.value && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedValue === item.value &&
                      styles.pickerItemTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Preview */}
      <View style={styles.imageSection}>
        <View style={styles.imageHeader}>
          <Text style={styles.sectionTitle}>Captured Image</Text>
          <TouchableOpacity onPress={onReset} style={styles.retakeButton}>
            <Ionicons name="refresh" size={16} color="#2563EB" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.capturedImage} />
          <View style={styles.imageOverlay}>
            <Ionicons name="cloud-upload" size={20} color="#2563EB" />
            <Text style={styles.imageOverlayText}>
              Will be saved to storage
            </Text>
          </View>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>

        <View style={styles.form}>
          {/* User Email Assignment */}
          <View style={styles.field}>
            <Text style={styles.label}>Assign to User Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.userEmail}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    userEmail: text.toLowerCase().trim(),
                  }))
                }
                placeholder="Enter user's email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.hint}>
              Enter the email of the user who owns this vehicle
            </Text>
          </View>

          {/* License Plate */}
          <View style={styles.field}>
            <Text style={styles.label}>License Plate *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="document-text"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.licensePlate}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    licensePlate: text.toUpperCase(),
                  }))
                }
                placeholder="Enter license plate"
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
          </View>

          {/* Vehicle Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Vehicle Type *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowVehicleTypePicker(true)}
            >
              <Ionicons
                name="car"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.vehicleType && styles.placeholder,
                ]}
              >
                {formData.vehicleType || "Select vehicle type"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Parking Slot */}
          <View style={styles.field}>
            <Text style={styles.label}>Parking Slot *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSlotPicker(true)}
            >
              <Ionicons
                name="location"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.slotNumber && styles.placeholder,
                ]}
              >
                {formData.slotNumber
                  ? `Slot ${formData.slotNumber}`
                  : "Select parking slot"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.hint}>
              {availableSlots.length} slot
              {availableSlots.length !== 1 ? "s" : ""} available
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? "Registering & Saving..." : "Register Vehicle"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle Type Picker Modal */}
      <PickerModal
        visible={showVehicleTypePicker}
        onClose={() => setShowVehicleTypePicker(false)}
        title="Select Vehicle Type"
        items={vehicleTypes}
        selectedValue={formData.vehicleType}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, vehicleType: value }))
        }
      />

      {/* Slot Picker Modal */}
      <PickerModal
        visible={showSlotPicker}
        onClose={() => setShowSlotPicker(false)}
        title="Select Parking Slot"
        items={availableSlots.map((slot) => ({
          label: `Slot ${slot.slotNumber}`,
          value: slot.slotNumber.toString(),
        }))}
        selectedValue={formData.slotNumber}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, slotNumber: value }))
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  imageSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
  },
  retakeText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  capturedImage: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: "#F1F5F9",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  form: {
    marginTop: 16,
  },
  field: {
    marginBottom: 20,
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
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 8,
  },
  placeholder: {
    color: "#9CA3AF",
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  pickerContainer: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1E293B",
  },
  pickerItemTextSelected: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
