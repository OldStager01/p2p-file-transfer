import { Theme } from "@react-navigation/native";

interface CustomTheme extends Theme {
  colors: {
    primary: string;
    success: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}

export const CustomLightTheme: CustomTheme = {
  dark: false,
  colors: {
    primary: "#1e90ff",
    success: "#22C55E",
    background: "#ffffff",
    card: "#f2f2f2",
    text: "#000000",
    border: "#e0e0e0",
    notification: "#ff453a",
  },
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "bold",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "900",
    },
  },
};

export const CustomDarkTheme: CustomTheme = {
  dark: true,
  colors: {
    primary: "#3d9eff",
    success: "#22C55E",
    background: "#121212",
    card: "#1e1e1e",
    text: "#ffffff",
    border: "#666",
    notification: "#ff453a",
  },
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "bold",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "900",
    },
  },
};
