import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

export default function ActiveUploads({ uploads, onSelectUpload }) {
  const { colors } = useTheme();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Calculate time difference
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderUploadCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.uploadCard, { backgroundColor: colors.card }]}
      onPress={() => onSelectUpload(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.uploadTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.uploadTime, { color: colors.text + "70" }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <View
          style={[styles.codeBadge, { backgroundColor: colors.primary + "20" }]}
        >
          <Text style={[styles.codeText, { color: colors.primary }]}>
            {item.connectionCode}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Ionicons
            name="document-outline"
            size={14}
            color={colors.text + "60"}
          />
          <Text style={[styles.statText, { color: colors.text + "60" }]}>
            {item.file_count} file{item.file_count !== 1 ? "s" : ""} (
            {formatSize(item.total_size)})
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons
            name="download-outline"
            size={14}
            color={colors.text + "60"}
          />
          <Text style={[styles.statText, { color: colors.text + "60" }]}>
            {item.download_count} download{item.download_count !== 1 ? "s" : ""}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.text + "60"} />
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={uploads}
      renderItem={renderUploadCard}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: 2,
  },
  uploadCard: {
    width: 240,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  uploadTitle: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
  uploadTime: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  codeText: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: FONTS.sizes.caption,
    marginLeft: 4,
  },
});
