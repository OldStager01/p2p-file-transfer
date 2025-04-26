import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

interface TransferProgressModalProps {
  visible: boolean;
  onClose: () => void;
  transferItems: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
  }>;
  onComplete?: () => void;
}

export default function TransferProgressModal({
  visible,
  onClose,
  transferItems,
  onComplete,
}: TransferProgressModalProps) {
  const { colors } = useTheme();
  const [isComplete, setIsComplete] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Function to format bytes to readable size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate overall progress
  useEffect(() => {
    if (!transferItems.length) return;

    const totalProgress = transferItems.reduce(
      (sum, item) => sum + item.progress,
      0
    );
    const currentProgress = totalProgress / transferItems.length;
    setOverallProgress(currentProgress);

    // Animate the progress bar
    Animated.spring(progressAnim, {
      toValue: currentProgress,
      useNativeDriver: false,
      friction: 8,
    }).start();

    // Check if transfer is complete
    if (currentProgress >= 0.99) {
      setIsComplete(true);
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (onComplete) onComplete();
    }
  }, [transferItems]);

  const handleClose = () => {
    if (isComplete || !visible) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.headerContainer}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isComplete ? "Transfer Complete" : "Transferring Files"}
            </Text>
            {isComplete && (
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isComplete ? "#43A047" : colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {Math.round(overallProgress * 100)}%
            </Text>
          </View>

          <View style={styles.fileListContainer}>
            {transferItems.map((item) => (
              <View key={item.id} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Text
                    style={[styles.fileName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.fileSize, { color: colors.text + "80" }]}
                  >
                    {formatSize(item.size)}
                  </Text>
                </View>
                <View style={styles.fileProgress}>
                  {item.progress < 1 && !isComplete ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#43A047"
                    />
                  )}
                  <Text
                    style={[
                      styles.fileProgressText,
                      {
                        color:
                          item.progress < 1 ? colors.text + "80" : "#43A047",
                      },
                    ]}
                  >
                    {Math.round(item.progress * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {isComplete && (
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.semiBold,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    width: 40,
    textAlign: "right",
  },
  fileListContainer: {
    marginBottom: SPACING.md,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
  },
  fileInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  fileSize: {
    fontSize: FONTS.sizes.caption,
  },
  fileProgress: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    justifyContent: "flex-end",
  },
  fileProgressText: {
    fontSize: FONTS.sizes.caption,
    marginLeft: 5,
  },
  closeButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
});
