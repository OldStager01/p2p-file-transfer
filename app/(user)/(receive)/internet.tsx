import { Text, View, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import Button from "@/components/Button";

export default function Internet() {
  const { colors } = useTheme();
  const { session, loading, error } = useAuth();
  // Optional: Log out if there's an auth error
  useEffect(() => {
    if (error) {
      supabase.auth.signOut(); // Optional, only if you want to auto-sign-out
    }
  }, [error]);

  if (loading) return null; // or loading spinner
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
    <View>
      <Text style={{ color: colors.text }}>Internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
});
