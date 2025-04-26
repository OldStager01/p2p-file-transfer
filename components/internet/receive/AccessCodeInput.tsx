import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";
import Clipboard from "@react-native-clipboard/clipboard";
import * as Haptics from "expo-haptics";

export default function AccessCodeInput({
  connectionCode,
  onChangeText,
  onSubmit,
  error,
  loading,
  colors,
}) {
  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      const cleanedText = text.replace(/[^0-9]/g, "").slice(0, 6);
      if (cleanedText.length > 0) {
        onChangeText(cleanedText);

        // Provide haptic feedback on successful paste
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      console.error("Failed to paste from clipboard", err);
    }
  };

  return (
    <View
      style={[styles.accessCodeContainer, { backgroundColor: colors.card }]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="key-outline" size={40} color={colors.primary} />
      </View>

      <Text style={[styles.accessTitle, { color: colors.text }]}>
        Access Shared Files
      </Text>

      <Text style={[styles.accessSubtitle, { color: colors.text + "70" }]}>
        Enter the 6-digit connection code to access files
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          style={[
            styles.codeInput,
            {
              color: colors.text,
              borderColor: error ? "#F44771" : colors.border,
              backgroundColor: colors.background + "50",
            },
          ]}
          value={connectionCode}
          onChangeText={onChangeText}
          placeholder="123456"
          placeholderTextColor={colors.text + "40"}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => {
            if (connectionCode.length === 6 && !loading) {
              onSubmit();
            }
          }}
        />

        <TouchableOpacity
          style={[
            styles.pasteButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.background + "50",
            },
          ]}
          onPress={handlePasteFromClipboard}
          activeOpacity={0.7}
        >
          <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#F44771" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Button
        text={loading ? "Checking..." : "Access Files"}
        onPress={onSubmit}
        disabled={connectionCode.length !== 6 || loading}
        style={{ marginTop: SPACING.md }}
        loading={loading}
        icon={loading ? null : "log-in-outline"}
      />

      <Text style={[styles.instructionText, { color: colors.text + "60" }]}>
        Enter the code provided by the sender to access shared files
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accessCodeContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(103, 58, 183, 0.1)", // Light purple background
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  accessTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  accessSubtitle: {
    fontSize: FONTS.sizes.body,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  codeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  codeInput: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: FONTS.weights.medium,
  },
  pasteButton: {
    height: 60,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  errorText: {
    color: "#F44771",
    marginLeft: 5,
    fontSize: FONTS.sizes.caption,
  },
  instructionText: {
    textAlign: "center",
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    lineHeight: 16,
  },
});
