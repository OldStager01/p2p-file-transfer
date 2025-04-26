import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import Button from "@/components/Button";
import DownloadHistory from "@/components/internet/receive/DownloadHistory";
import { SPACING } from "@/themes";

export default function Downloads() {
  const { colors } = useTheme();
  const { session, loading, error } = useAuth();

  // Auth check
  if (loading) return null;
  if (!session) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 16 }}>
          You must be logged in to view this page.
        </Text>
        <Button
          style={{ paddingHorizontal: 20 }}
          text="Sign In"
          onPress={() => router.push("/signIn")}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Downloaded Files
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "70" }]}>
          Access your previously downloaded files
        </Text>
      </View>

      <DownloadHistory colors={colors} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
  },
});
