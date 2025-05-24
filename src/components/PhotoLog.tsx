"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { storageService, type StoredImage } from "../services/storageService";

interface PhotoLogProps {
  visible: boolean;
  onClose: () => void;
}

export const PhotoLog: React.FC<PhotoLogProps> = ({ visible, onClose }) => {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (visible) {
      loadImages();
    }
  }, [visible]);

  const loadImages = async () => {
    try {
      const storedImages = await storageService.getAllImages();
      setImages(storedImages);
    } catch (error) {
      console.error("Error loading images:", error);
      Alert.alert("Error", "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleDeleteImage = (image: StoredImage) => {
    Alert.alert(
      "Delete Image",
      `Are you sure you want to delete this image for ${image.licensePlate}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storageService.deleteImage(image.name);
              await loadImages();
              Alert.alert("Success", "Image deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete image");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllImages = () => {
    Alert.alert(
      "Delete All Images",
      "Are you sure you want to delete all stored images? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await storageService.deleteAllImages();
              await loadImages();
              Alert.alert("Success", "All images deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete images");
            }
          },
        },
      ]
    );
  };

  const openImageModal = (image: StoredImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const renderImageItem = ({ item }: { item: StoredImage }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => openImageModal(item)}
    >
      <Image source={{ uri: item.url }} style={styles.thumbnail} />
      <View style={styles.imageInfo}>
        <Text style={styles.licensePlate}>
          {item.licensePlate || "Unknown"}
        </Text>
        <Text style={styles.vehicleType}>
          {item.vehicleType || "Unknown Type"}
        </Text>
        <Text style={styles.slotNumber}>Slot {item.slotNumber || "N/A"}</Text>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteImage(item)}
      >
        <Ionicons name="trash" size={20} color="#DC2626" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Photo Log</Text>
              <Text style={styles.headerSubtitle}>
                {images.length} stored images
              </Text>
            </View>
          </View>
          {images.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAllImages}
              style={styles.deleteAllButton}
            >
              <Ionicons name="trash" size={20} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="images" size={48} color="#64748B" />
            <Text style={styles.loadingText}>Loading images...</Text>
          </View>
        ) : images.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#64748B" />
            <Text style={styles.emptyTitle}>No Images Found</Text>
            <Text style={styles.emptyMessage}>
              Captured license plate images will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Image Modal */}
        <Modal visible={showImageModal} transparent animationType="fade">
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalContent}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>
                  {selectedImage?.licensePlate}
                </Text>
                <TouchableOpacity onPress={() => setShowImageModal(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {selectedImage && (
                <>
                  <Image
                    source={{ uri: selectedImage.url }}
                    style={styles.fullImage}
                  />
                  <View style={styles.imageModalInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="car" size={16} color="#64748B" />
                      <Text style={styles.infoText}>
                        {selectedImage.vehicleType}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={16} color="#64748B" />
                      <Text style={styles.infoText}>
                        Slot {selectedImage.slotNumber}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time" size={16} color="#64748B" />
                      <Text style={styles.infoText}>
                        {formatDate(selectedImage.timestamp)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
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
  deleteAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  imageItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  imageInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "monospace",
  },
  vehicleType: {
    fontSize: 14,
    color: "#64748B",
  },
  slotNumber: {
    fontSize: 14,
    color: "#64748B",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignSelf: "center",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
  },
  imageModalContent: {
    flex: 1,
    paddingTop: 50,
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  imageModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "monospace",
  },
  fullImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").width * 0.75,
    resizeMode: "contain",
  },
  imageModalInfo: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    margin: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
  },
});
