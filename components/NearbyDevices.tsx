import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import { LocalDeviceType } from "@/types";
import { useFocusEffect, useNavigation } from "expo-router";
import useZeroconfService from "@/hooks/useZeroconf";

export default function NearbyDevices() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { devices, refreshDevices, stopDiscovery, startAdvertising } =
    useZeroconfService();

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Refreshing devices...");
      refreshDevices();
      return () => {
        console.log("🛑 Stopping device discovery...");
        stopDiscovery();
      };
    }, [])
  );

  const sendData = (device: LocalDeviceType) => {
    (navigation as any).navigate("test", { device });
  };

  const device = (dev: LocalDeviceType) => (
    <Pressable
      style={{ ...styles.device, borderColor: colors.border }}
      onPress={() => sendData(dev)}
    >
      <FontAwesome name="wifi" size={20} color={colors.text} />
      <Text style={{ color: colors.text }}>{dev.name}</Text>
    </Pressable>
  );
  return (
    <View style={{ ...styles.container, borderColor: colors.border }}>
      <View style={styles.deviceContainer}>
        <FlatList
          data={devices}
          renderItem={({ item }) => device(item)}
          keyExtractor={(item: LocalDeviceType) => item.ip}
        />
        {/* Add At End */}
        <View style={styles.refreshSection}>
          <Text style={{ marginTop: 10, color: colors.text }}>
            Can't find your device?
          </Text>
          <Pressable
            onPress={startAdvertising}
            style={{ ...styles.refreshButton, borderColor: colors.border }}
          >
            <FontAwesome name="refresh" size={20} color={colors.text} />
            <Text style={{ color: colors.text }}>Refresh</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  deviceContainer: {
    gap: 10,
  },
  device: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 15,
    padding: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
  refreshSection: {
    alignSelf: "center",
    alignItems: "center",
    rowGap: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    borderWidth: 2,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
