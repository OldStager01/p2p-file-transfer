import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "expo-router";

import { LocalDeviceType } from "@/types";
import useZeroconfService from "@/hooks/useZeroconf";
import { SPACING, RADIUS, FONTS, COLORS, SHADOWS } from "@/themes";

export default function NearbyDevices() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const {
    devices,
    refreshDevices,
    stopDiscovery,
    startDiscovery,
    startAdvertising,
  } = useZeroconfService();

  // Animation setup for refreshing button
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Start animation when refreshing
  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
      return () => {
        console.log("🛑 Stopping device discovery...");
        stopDiscovery();
        setRefreshing(false);
      };
    }, [])
  );

  const handleRefresh = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRefreshing(true);
    console.log("🔄 Refreshing devices...");
    startAdvertising();
    startDiscovery();

    refreshDevices();
    // Auto stop refreshing after 5 seconds
    setTimeout(() => {
      setRefreshing(false);
    }, 5000);
  };

  const handleDevicePress = (device: LocalDeviceType) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSelectedDevice(device.ip);
    setTimeout(() => {
      (navigation as any).navigate("test", { device });
    }, 200);
  };

  const renderDeviceItem = ({ item }: { item: LocalDeviceType }) => {
    const isSelected = selectedDevice === item.ip;

    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleDevicePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.deviceIconContainer}>
          <Ionicons
            name="phone-portrait-outline"
            size={24}
            color={colors.text}
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.deviceIp, { color: colors.text + "80" }]}>
            {item.ip}
          </Text>
        </View>

        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: COLORS.statusIndicator.online },
          ]}
        />
      </TouchableOpacity>
    );
  };

  const EmptyDevicesList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="wifi-outline"
        size={40}
        color={colors.text}
        style={{ opacity: 0.5 }}
      />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No devices found
      </Text>
      <Text style={[styles.emptySubText, { color: colors.text + "80" }]}>
        Make sure other devices are on the same network
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <FlatList
        scrollEnabled={false}
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item: LocalDeviceType) => item.ip}
        contentContainerStyle={styles.deviceListContent}
        ListEmptyComponent={EmptyDevicesList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.refreshContainer}>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: refreshing
                ? colors.primary + "20"
                : colors.primary,
              opacity: refreshing ? 0.8 : 1,
            },
          ]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={refreshing ? colors.primary : "#FFF"}
              />
            </Animated.View>
          )}
          <Text
            style={[
              styles.refreshText,
              {
                color: refreshing ? colors.primary : "#FFF",
              },
            ]}
          >
            {refreshing ? "Searching..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    minHeight: 120,
    ...SHADOWS.small,
  },
  deviceListContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2, // Extra space for the refresh button
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  deviceName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  deviceIp: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
  },
  emptySubText: {
    fontSize: FONTS.sizes.caption,
    textAlign: "center",
    marginTop: SPACING.xs,
    maxWidth: "80%",
  },
  refreshContainer: {
    position: "absolute",
    bottom: SPACING.md,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    ...SHADOWS.small,
  },
  refreshText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
});
