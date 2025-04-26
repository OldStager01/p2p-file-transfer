import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@react-navigation/native";
import Button from "@/components/Button";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function Profile() {
  const { session } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {session ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <MaterialIcons name="account-circle" size={80} color={colors.text} />

          <Text style={[styles.label, { color: colors.text }]}>User ID</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {session.user.id}
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {session.user.email}
          </Text>

          <Pressable
            onPress={handleSignOut}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.authMessage}>
          <Text style={[styles.message, { color: colors.text }]}>
            You are not logged in.
          </Text>
          <Text style={[styles.message, { color: colors.text }]}>
            Please sign up or log in to view your profile.
          </Text>

          <View style={styles.linkContainer}>
            <Button
              text="Sign In"
              style={{ paddingHorizontal: 30 }}
              onPress={() => router.push("/signIn")}
            />
            <Button
              text="Sign Up"
              style={{ paddingHorizontal: 30, marginTop: 10 }}
              onPress={() => router.push("/signUp")}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    borderRadius: 12,
    padding: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "500",
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  authMessage: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  linkContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
});
