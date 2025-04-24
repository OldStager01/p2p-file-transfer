import AuthProvider, { useAuth } from "@/providers/AuthProvider";
import { CustomDarkTheme, CustomLightTheme } from "@/themes";
import { ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: theme.colors.background,
              flex: 1,
            },
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(user)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
