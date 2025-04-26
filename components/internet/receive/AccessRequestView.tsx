import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

export default function AccessRequestView({
  onRequestAccess,
  onTryAnotherCode,
  error,
  colors,
}) {
  return (
    <View
      style={[styles.accessRequestContainer, { backgroundColor: colors.card }]}
    >
      <View style={styles.lockIconContainer}>
        <Ionicons name="lock-closed" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.accessTitle, { color: colors.text }]}>
        Access Required
      </Text>
      <Text style={[styles.accessMessage, { color: colors.text + "80" }]}>
        This is a private transfer. You need permission from the owner to access
        these files.
      </Text>

      {error && (
        <View style={[styles.statusBox, { backgroundColor: "#F4477115" }]}>
          <Text style={[styles.statusText, { color: "#F44771" }]}>{error}</Text>
        </View>
      )}

      <Button
        text="Request Access"
        onPress={onRequestAccess}
        style={{ marginTop: SPACING.md }}
      />

      <TouchableOpacity onPress={onTryAnotherCode} style={styles.backButton}>
        <Text style={{ color: colors.primary }}>Try Another Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  accessRequestContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(103, 58, 183, 0.1)", // purple-ish background
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  accessTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  accessMessage: {
    textAlign: "center",
    marginBottom: SPACING.md,
    fontSize: FONTS.sizes.body,
    lineHeight: 22,
  },
  statusBox: {
    width: "100%",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginVertical: SPACING.sm,
  },
  statusText: {
    textAlign: "center",
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
  },
  backButton: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
});
