import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { Link, router, Stack } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "@react-navigation/native";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign up" }} />

      <Text style={{ ...styles.label, color: colors.text }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="jon@gmail.com"
        style={{
          ...styles.input,
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      />

      <Text style={{ ...styles.label, color: colors.text }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder=""
        style={{
          ...styles.input,
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
        secureTextEntry
      />

      <Button
        onPress={signUpWithEmail}
        disabled={loading}
        text={loading ? "Creating account..." : "Create account"}
      />
      <Pressable
        onPress={() => {
          router.replace("/signIn");
        }}
      >
        <Text style={{ ...styles.textButton, color: colors.text }}>
          Sign in
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
    backgroundColor: "white",
    borderRadius: 5,
  },
  textButton: {
    alignSelf: "center",
    fontWeight: "bold",
    color: Colors.light.tint,
    marginVertical: 10,
  },
});

export default SignUpScreen;
