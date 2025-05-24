"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { CameraView } from "../components/CameraView"
import { VehicleForm } from "../components/VehicleForm"
import type { NavigationProps } from "../types"

export const CameraScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null)

  const handlePhotoCapture = (uri: string) => {
    setImageUri(uri)
  }

  const handleReset = () => {
    setImageUri(null)
  }

  const handleSuccess = () => {
    setImageUri(null)
    navigation.navigate("Home")
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {imageUri && (
            <TouchableOpacity onPress={handleReset} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Vehicle Registration</Text>
            <Text style={styles.headerSubtitle}>
              {!imageUri ? "Take a photo of the license plate" : "Complete vehicle details"}
            </Text>
          </View>
          {!imageUri && (
            <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!imageUri ? (
          <CameraView onCapture={handlePhotoCapture} />
        ) : (
          <VehicleForm imageUri={imageUri} onReset={handleReset} onSuccess={handleSuccess} />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#2563EB",
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  closeButton: {
    marginLeft: 16,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#BFDBFE",
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
})
