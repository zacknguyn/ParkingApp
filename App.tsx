"use client";

import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, Alert } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { CameraScreen } from "./src/screens/CameraScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AuthScreen } from "./src/components/AuthScreen";
import { authService, type AuthState } from "./src/services/authService";

const Tab = createBottomTabNavigator();

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        console.log("Initializing app...");

        // Add a longer delay to ensure Firebase is fully ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!isMounted) return;

        console.log("Setting up auth listener...");

        // Set up auth state listener
        const unsubscribe = authService.onAuthStateChanged((newAuthState) => {
          if (isMounted) {
            console.log("Auth state updated:", newAuthState);
            setAuthState(newAuthState);
            setIsInitialized(true);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("App initialization error:", error);
        if (isMounted) {
          setAuthState({ user: null, profile: null, loading: false });
          setIsInitialized(true);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSuccess = () => {
    console.log("Authentication successful");
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      Alert.alert("Signed Out", "You have been signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  if (!isInitialized || authState.loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="car-sport" size={48} color="#2563EB" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Show authentication screen if user is not logged in
  if (!authState.user || !authState.profile) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const isAdmin = authState.profile.role === "admin";

  // Show main app if user is authenticated
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Camera") {
                iconName = focused ? "camera" : "camera-outline";
              } else if (route.name === "Settings") {
                iconName = focused ? "settings" : "settings-outline";
              } else {
                iconName = "home-outline";
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: "#2563EB",
            tabBarInactiveTintColor: "#6B7280",
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: "#E5E7EB",
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          })}
        >
          <Tab.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                userProfile={authState.profile}
                onSignOut={handleSignOut}
              />
            )}
          </Tab.Screen>
          {/* Camera tab only visible to admins */}
          {isAdmin && <Tab.Screen name="Camera" component={CameraScreen} />}
          <Tab.Screen name="Settings">
            {(props) => (
              <SettingsScreen
                {...props}
                userProfile={authState.profile}
                onSignOut={handleSignOut}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: "500",
  },
});
