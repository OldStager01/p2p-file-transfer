import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import SelectItems from "@/components/SelectItems";
import SelectedItems from "@/components/SelectedItems";
import NearbyDevices from "@/components/NearbyDevices";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

const { width } = Dimensions.get("window");

export default function Local() {
  const { colors } = useTheme();
  const { selectedItems } = useSelectedItems();
  const [scanning, setScanning] = useState(false);
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  // Animation for scanning effect
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [scanning]);

  const handleRefresh = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setScanning(true);

    // Simulate scanning for 2 seconds
    setTimeout(() => {
      setScanning(false);
    }, 2000);
  };

  const scanOpacity = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* SELECT ITEMS SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Select Items
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.text }]}>
            Choose what you want to send
          </Text>
        </View>
        <SelectItems />
      </View>

      {/* SELECTED ITEMS SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Selected Items
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.text }]}>
            {selectedItems.length}{" "}
            {selectedItems.length === 1 ? "item" : "items"} ready to send
          </Text>
        </View>
        <SelectedItems />
      </View>

      {/* NEARBY DEVICES SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sendHeadingContainer}>
          <View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Nearby Devices
            </Text>
            <Text style={[styles.sectionSubheading, { color: colors.text }]}>
              Tap a device to start sending
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.refreshButton,
              { backgroundColor: colors.primary + "15" }, // 15% opacity
            ]}
            onPress={handleRefresh}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Scanning animation overlay */}
        {scanning && (
          <View style={styles.scanningContainer}>
            <Animated.View
              style={[styles.scanningOverlay, { opacity: scanOpacity }]}
            />
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        )}

        <NearbyDevices />

        {/* Help section */}
        <View style={styles.helpSection}>
          <LinearGradient
            colors={[COLORS.primary + "20", COLORS.primary + "05"]}
            style={styles.helpGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>How to use local transfer</Text>
              <Text style={styles.helpDescription}>
                Make sure both devices are on the same WiFi network and have the
                app open.
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    marginBottom: SPACING.xs / 2,
  },
  sectionSubheading: {
    fontSize: FONTS.sizes.caption,
    opacity: 0.6,
    marginBottom: SPACING.sm,
  },
  sendHeadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningContainer: {
    position: "absolute",
    top: SPACING.xl,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  scanningText: {
    color: "#fff",
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.subtitle,
  },
  helpSection: {
    marginTop: SPACING.lg,
  },
  helpGradient: {
    flexDirection: "row",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  helpTextContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  helpTitle: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  helpDescription: {
    fontSize: FONTS.sizes.caption,
    color: COLORS.primary,
    opacity: 0.8,
  },
});
