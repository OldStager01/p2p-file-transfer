import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Sample connection history data
const SAMPLE_CONNECTIONS = [
  {
    id: "1",
    code: "123456",
    title: "Project Documents",
    accessedAt: "2025-04-24T18:30:00Z",
    fileCount: 3,
  },
  {
    id: "2",
    code: "789012",
    title: "Vacation Photos",
    accessedAt: "2025-04-22T14:15:00Z",
    fileCount: 12,
  },
  {
    id: "3",
    code: "345678",
    title: "Meeting Notes",
    accessedAt: "2025-04-20T09:45:00Z",
    fileCount: 1,
  },
];

export default function ConnectionHistory({ onUseCode }) {
  const { colors } = useTheme();
  const [connections, setConnections] = useState(SAMPLE_CONNECTIONS);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Calculate time difference
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConnectionItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.connectionItem, { backgroundColor: colors.card }]}
      onPress={() => onUseCode(item.code)}
    >
      <View style={styles.codeContainer}>
        <Text style={[styles.connectionCode, { color: colors.primary }]}>
          {item.code}
        </Text>
      </View>

      <View style={styles.connectionDetails}>
        <Text
          style={[styles.connectionTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.connectionInfo, { color: colors.text + "70" }]}>
          {formatDate(item.accessedAt)} • {item.fileCount} file
          {item.fileCount !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.text + "60"} />
      </View>
    </TouchableOpacity>
  );

  if (connections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Connections
      </Text>

      <FlatList
        data={connections}
        renderItem={renderConnectionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    marginBottom: SPACING.sm,
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  codeContainer: {
    padding: SPACING.sm,
    backgroundColor: "rgba(103, 58, 183, 0.1)", // Light purple background
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  connectionCode: {
    fontWeight: FONTS.weights.semiBold,
    fontSize: FONTS.sizes.body,
  },
  connectionDetails: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  connectionInfo: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  iconContainer: {
    padding: SPACING.xs,
  },
});
