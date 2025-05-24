"use client";

import type React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhotoLog } from "../components/PhotoLog";
import { storageService } from "../services/storageService";
import type { UserProfile } from "../services/authService";

interface SettingsScreenProps {
  userProfile: UserProfile | null;
  onSignOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userProfile,
  onSignOut,
}) => {
  const [notifications, setNotifications] = useState(true);
  const [timeFormat, setTimeFormat] = useState(false);
  const [showPhotoLog, setShowPhotoLog] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: onSignOut,
      },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all stored images and reset all parking slots. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await storageService.deleteAllImages();
              Alert.alert("Success", "All data has been cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightComponent,
    onPress,
    iconColor = "#64748B",
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          {userProfile?.displayName} ({userProfile?.role})
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-circle"
              title={userProfile?.displayName || "User"}
              subtitle={userProfile?.email}
              iconColor="#2563EB"
            />
            <View style={styles.separator} />
            <SettingItem
              icon={
                userProfile?.role === "admin" ? "shield-checkmark" : "person"
              }
              title="Role"
              subtitle={
                userProfile?.role === "admin" ? "Administrator" : "User"
              }
              iconColor={userProfile?.role === "admin" ? "#DC2626" : "#64748B"}
            />
          </View>
        </View>

        {/* Data Management - Only for admins */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon="images-outline"
                title="Photo Log"
                subtitle="View captured license plate images"
                rightComponent={
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                }
                onPress={() => setShowPhotoLog(true)}
                iconColor="#2563EB"
              />

              <View style={styles.separator} />

              <SettingItem
                icon="cloud-outline"
                title="Storage Usage"
                subtitle="Manage stored images and data"
                rightComponent={
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                }
                onPress={() =>
                  Alert.alert(
                    "Storage Usage",
                    "Storage management features coming soon"
                  )
                }
              />

              <View style={styles.separator} />

              <SettingItem
                icon="trash-outline"
                title="Clear All Data"
                subtitle="Delete all images and reset slots"
                rightComponent={
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                }
                onPress={handleClearAllData}
                iconColor="#DC2626"
              />
            </View>
          </View>
        )}

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Receive parking alerts"
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <View style={styles.separator} />

            <SettingItem
              icon="time-outline"
              title="24-hour format"
              subtitle="Use 24-hour time display"
              rightComponent={
                <Switch
                  value={timeFormat}
                  onValueChange={setTimeFormat}
                  trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              }
              onPress={() =>
                Alert.alert("Privacy Policy", "Privacy policy would open here")
              }
            />

            <View style={styles.separator} />

            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              }
              onPress={() =>
                Alert.alert("Help & Support", "Help section would open here")
              }
            />

            <View style={styles.separator} />

            <SettingItem
              icon="information-circle-outline"
              title="About"
              rightComponent={
                <View style={styles.aboutRight}>
                  <Text style={styles.versionText}>v1.0.0</Text>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </View>
              }
              onPress={() =>
                Alert.alert("About", "Parking Management App v1.0.0")
              }
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Photo Log Modal - Only for admins */}
      {isAdmin && (
        <PhotoLog
          visible={showPhotoLog}
          onClose={() => setShowPhotoLog(false)}
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
  header: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#BFDBFE",
    marginTop: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  aboutRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  signOutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
