import { View, Text, useColorScheme } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import SelectedItemsProvider from "@/providers/SelectedItemsProvider";

export default function Layout() {
  const { colors } = useTheme();
  return (
    <SelectedItemsProvider>
      <Stack
        screenOptions={{
          title: "P2P Transfer",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(transfer)" />
      </Stack>
    </SelectedItemsProvider>
  );
}
