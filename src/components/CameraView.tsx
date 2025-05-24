"use client"

import type React from "react"
import { useState, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from "react-native"
import { CameraView as ExpoCameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"

interface CameraViewProps {
  onCapture: (imageUri: string) => void
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture }) => {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<"front" | "back">("back")
  const cameraRef = useRef<any>(null)

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="camera" size={48} color="#64748B" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#64748B" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>We need access to your camera to take photos of license plates</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        })
        if (photo.uri) {
          onCapture(photo.uri)
        } else {
          Alert.alert("Error", "Failed to capture image")
        }
      } catch (error) {
        console.error("Camera error:", error)
        Alert.alert("Error", "Failed to take picture")
      }
    }
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.centerContainer}>
            <View style={styles.guidesContainer}>
              <View style={styles.guides} />
              <Text style={styles.guideText}>Position license plate within the frame</Text>
            </View>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner}>
                <Ionicons name="camera" size={32} color="#2563EB" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ExpoCameraView>

      <View style={styles.instructionsContainer}>
        <View style={styles.instructionItem}>
          <Ionicons name="sunny" size={20} color="#2563EB" />
          <Text style={styles.instructionText}>Ensure good lighting</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="eye" size={20} color="#2563EB" />
          <Text style={styles.instructionText}>Keep plate clearly visible</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="hand-left" size={20} color="#2563EB" />
          <Text style={styles.instructionText}>Hold steady when capturing</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8FAFC",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    padding: 16,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  flipButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guidesContainer: {
    alignItems: "center",
  },
  guides: {
    borderWidth: 2,
    borderColor: "white",
    borderStyle: "dashed",
    width: Dimensions.get("window").width * 0.8,
    height: 120,
    borderRadius: 8,
    opacity: 0.8,
  },
  guideText: {
    color: "white",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 4,
  },
  bottomControls: {
    alignItems: "center",
    padding: 16,
  },
  captureButton: {
    width: 70,
    height: 70,
    backgroundColor: "white",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748B",
  },
})
