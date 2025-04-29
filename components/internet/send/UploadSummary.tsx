import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  Share,
  Image,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Clipboard from "@react-native-clipboard/clipboard";
import { router } from "expo-router";
import Button from "@/components/Button";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";
import * as Haptics from "expo-haptics";
import { SelectedItemType } from "@/types";

export default function UploadSummary({
  connectionCode,
  uploadDetails,
  selectedItems,
  onUploadMore,
}: {
  connectionCode: string;
  uploadDetails: any;
  selectedItems: SelectedItemType[];
  onUploadMore: () => void;
}) {
  const { colors } = useTheme();
  const { clearSelection } = useSelectedItems();
  const [showConfetti, setShowConfetti] = useState(true);

  // Animation
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Play haptic feedback on successful upload
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    if (!date) return "No expiry";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyCode = () => {
    Clipboard.setString(connectionCode);
    if (Platform.OS === "android") {
      ToastAndroid.show("Connection Code Copied", ToastAndroid.SHORT);
    } else if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const shareTransfer = async () => {
    try {
      const message = `Here's a file I'd like to share with you! Use connection code: ${connectionCode} on my file transfer app.`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleUploadMore = () => {
    // Clear selected items and navigate back to selection
    clearSelection();
    onUploadMore();
  };

  const handleViewUploads = () => {
    router.push("/(user)/(receive)/internet");
  };

  return (
    <View style={styles.contentContainer}>
      {showConfetti && (
        <Image
          source={require("@/assets/images/confetti.gif")}
          style={styles.confettiImage}
        />
      )}

      <Animated.View
        style={[
          styles.summaryContainer,
          {
            backgroundColor: colors.card,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={40} color="#43A047" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Upload Complete!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.text + "80" }]}>
            Your files are ready to be shared
          </Text>
        </View>

        <View style={[styles.codeContainer, { borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.text + "80" }]}>
            Connection Code
          </Text>
          <View style={styles.codeWrapper}>
            <Text style={[styles.codeText, { color: colors.text }]}>
              {connectionCode}
            </Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyButton}>
              <FontAwesome name="copy" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.text + "80"}
            />
            <Text style={[styles.detailLabel, { color: colors.text + "80" }]}>
              Files:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {uploadDetails?.itemCount || 0}{" "}
              {uploadDetails?.itemCount && uploadDetails.itemCount === 1
                ? "file"
                : "files"}{" "}
              ({formatSize(uploadDetails?.totalSize)})
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name={
                uploadDetails?.isPublic
                  ? "globe-outline"
                  : "lock-closed-outline"
              }
              size={20}
              color={colors.text + "80"}
            />
            <Text style={[styles.detailLabel, { color: colors.text + "80" }]}>
              Access:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {uploadDetails?.isPublic
                ? "Public - Anyone with code"
                : "Restricted - Specific emails"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.text + "80"}
            />
            <Text style={[styles.detailLabel, { color: colors.text + "80" }]}>
              Expires:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {uploadDetails?.expiryDate
                ? formatDate(uploadDetails?.expiryDate)
                : "No expiry date set"}
            </Text>
          </View>

          {uploadDetails?.title && (
            <View style={styles.detailItem}>
              <Ionicons
                name="text-outline"
                size={20}
                color={colors.text + "80"}
              />
              <Text style={[styles.detailLabel, { color: colors.text + "80" }]}>
                Title:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {uploadDetails?.title}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "20" },
            ]}
            onPress={shareTransfer}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#5E35B120" }]}
            onPress={handleViewUploads}
          >
            <Ionicons name="albums-outline" size={22} color="#5E35B1" />
            <Text style={[styles.actionText, { color: "#5E35B1" }]}>
              My Uploads
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F4477120" }]}
          >
            <Ionicons name="close-circle-outline" size={22} color="#F44771" />
            <Text style={[styles.actionText, { color: "#F44771" }]}>
              Revoke
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Button
        text="Upload More Files"
        onPress={handleUploadMore}
        icon="cloud-upload-outline"
        style={styles.uploadMoreButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  confettiImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  summaryContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    marginBottom: SPACING.lg,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#43A04720",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: FONTS.sizes.body,
  },
  codeContainer: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  codeLabel: {
    fontSize: FONTS.sizes.caption,
    textAlign: "center",
    marginBottom: 5,
  },
  codeWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  codeText: {
    fontSize: 32,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 5,
    textAlign: "center",
  },
  copyButton: {
    padding: 5,
    marginLeft: SPACING.sm,
  },
  detailsContainer: {
    marginBottom: SPACING.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONTS.sizes.body,
    marginLeft: SPACING.sm,
    width: 60,
  },
  detailValue: {
    fontSize: FONTS.sizes.body,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    width: "30%",
  },
  actionText: {
    fontSize: FONTS.sizes.caption,
    marginTop: 5,
    fontWeight: FONTS.weights.medium,
  },
  uploadMoreButton: {
    marginTop: SPACING.md,
  },
});
