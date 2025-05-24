import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface StatusCardProps {
  label: string
  value: string | number
  backgroundColor: string
  textColor?: string
  iconName?: keyof typeof Ionicons.glyphMap
  iconColor?: string
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  backgroundColor,
  textColor = "#374151",
  iconName,
  iconColor = "#6B7280",
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        {iconName && (
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
        )}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
  },
})
