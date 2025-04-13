import AuthProvider from "@/providers/AuthProvider";
import { CustomDarkTheme, CustomLightTheme } from "@/themes";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar, useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.colors.background,
              flex: 1,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(user)" />
        </Stack>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      </AuthProvider>
    </ThemeProvider>
  );
}
