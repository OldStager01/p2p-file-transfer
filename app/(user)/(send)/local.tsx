import { Pressable, Text, View, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import SelectTypeCard from "@/components/SelectTypeCard";
import SelectItems from "@/components/SelectItems";
import SelectedItems from "@/components/SelectedItems";
import NearbyDevices from "@/components/NearbyDevices";

export default function Local() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {/* SELECT */}
      <View style={styles.sectionContainer}>
        <Text style={{ ...styles.sectionHeading, color: colors.text }}>
          Pick
        </Text>
        <SelectItems />
      </View>
      <View style={styles.sectionContainer}>
        <Text style={{ ...styles.sectionHeading, color: colors.text }}>
          Selected
        </Text>
        <SelectedItems />
      </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sendHeadingContainer}>
          <Text style={{ ...styles.sectionHeading, color: colors.text }}>
            Tap Device to Send
          </Text>
          <Pressable>
            <FontAwesome
              style={{ paddingRight: 20 }}
              name="refresh"
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>
        <NearbyDevices />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
  sendHeadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
