import { StyleSheet, Text, View } from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import DeviceInfo from "react-native-device-info";
import { SPACING, FONTS, SHADOWS } from "@/themes";

export default function Local() {
  const { colors } = useTheme();
  const [deviceName, setDeviceName] = useState("Your Device");

  useEffect(() => {
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Asynchronously fetches the device name, model, or a default value "Your Device"
     * if the above fail. If the fetch fails, logs an error to console.
     * @returns {Promise<void>}
     */
    /*******  57f9a1f5-014d-42b2-a3b7-d94e9c045dd8  *******/
    async function getDeviceInfo() {
      try {
        const name =
          (await DeviceInfo.getDeviceNameSync()) ||
          DeviceInfo.getModel() ||
          "Your Device";
        setDeviceName(name);
      } catch (error) {
        console.log("Error getting device name:", error);
      }
    }

    getDeviceInfo();
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.deviceCard,
          { backgroundColor: colors.card, ...SHADOWS.medium },
        ]}
      >
        <Ionicons name="wifi" size={80} color={colors.primary} />

        <Text style={[styles.deviceLabel, { color: colors.text }]}>
          Discoverable As
        </Text>

        <Text style={[styles.deviceName, { color: colors.text }]}>
          {deviceName}
        </Text>

        <View
          style={[styles.statusIndicator, { backgroundColor: colors.primary }]}
        />

        <Text style={[styles.statusText, { color: colors.text + "80" }]}>
          Ready for local transfers
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  deviceCard: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: "center",
  },
  deviceLabel: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  deviceName: {
    fontSize: FONTS.sizes.subheading,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.regular,
  },
});
