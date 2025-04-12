import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export default function profile() {
  const { session } = useAuth();
  const handleSignOut = () => {
    supabase.auth.signOut();
  };
  return (
    <View style={styles.container}>
      <Pressable onPress={handleSignOut} style={styles.button}>
        <Text style={{ color: "white" }}>Sign Out</Text>
      </Pressable>
      <Text>{session?.user.id}</Text>
      <Text>{session?.user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    color: "white",
    backgroundColor: "blue",
    padding: 10,
  },
});
