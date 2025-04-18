import AuthProvider, { useAuth } from "@/providers/AuthProvider";
import { CustomDarkTheme, CustomLightTheme } from "@/themes";
import { ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: theme.colors.background,
              flex: 1,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(user)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      </AuthProvider>
    </ThemeProvider>
  );
}
