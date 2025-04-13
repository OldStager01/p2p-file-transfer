import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";

export default function NearbyDevices() {
  const { colors } = useTheme();
  return (
    <View style={{ ...styles.container, borderColor: colors.border }}>
      <View style={styles.deviceContainer}>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>
        <Pressable style={{ ...styles.device, borderColor: colors.border }}>
          <FontAwesome name="wifi" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Tanmay's Device</Text>
        </Pressable>

        {/* Add At End */}
        <View style={styles.refreshSection}>
          <Text style={{ marginTop: 10, color: colors.text }}>
            Can't find your device?
          </Text>
          <Pressable
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
