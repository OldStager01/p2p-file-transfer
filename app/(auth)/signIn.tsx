import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import Button from "@/components/Button";
import { Link, router, Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "@react-navigation/native";

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    if (router.canGoBack()) {
      router.back();
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign in" }} />

      <Text style={{ color: colors.text }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="john@gmail.com"
        style={{
          ...styles.input,
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border,
        }}
        placeholderTextColor={`${colors.text}70` || colors.text}
      />

      <Text style={{ color: colors.text }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={{
          ...styles.input,
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border,
        }}
        placeholderTextColor={`${colors.text}70` || colors.text}
        secureTextEntry
      />

      <Button
        onPress={signInWithEmail}
        disabled={loading}
        text={loading ? "Signing in..." : "Sign in"}
      />
      <Pressable
        onPress={() => {
          router.replace("/signUp");
        }}
      >
        <Text style={{ ...styles.textButton, color: colors.text }}>
          Create an account
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    flex: 1,
  },
  label: {
    color: "gray",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginTop: 5,
    marginBottom: 20,
    borderRadius: 5,
  },
  textButton: {
    alignSelf: "center",
    fontWeight: "bold",
    marginVertical: 10,
  },
});

export default SignInScreen;
