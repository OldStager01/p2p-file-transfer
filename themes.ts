import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { Platform } from "react-native";

// Color palette
export const COLORS = {
  primary: "#4A6DF0",
  primaryLight: "#7B8EF3",
  secondary: "#4CAF50",
  danger: "#F44336",
  warning: "#FFC107",
  background: {
    light: "#FFFFFF",
    dark: "#121212",
  },
  surface: {
    light: "#F5F5F5",
    dark: "#1E1E1E",
  },
  border: {
    light: "#E0E0E0",
    dark: "#333333",
  },
  text: {
    light: {
      primary: "#000000",
      secondary: "#757575",
      disabled: "#BDBDBD",
    },
    dark: {
      primary: "#FFFFFF",
      secondary: "#AAAAAA",
      disabled: "#666666",
    },
  },
  statusIndicator: {
    online: "#4CAF50",
    offline: "#F44336",
    processing: "#FFC107",
  },
} as const;

export type ColorPalette = typeof COLORS;

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type Spacing = typeof SPACING;

// Typography
export const FONTS = {
  sizes: {
    caption: 12,
    body: 14,
    subtitle: 16,
    title: 18,
    heading: 22,
    largeHeading: 28,
  },
  weights: {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },
  families: {
    regular: Platform.OS === "ios" ? "System" : "Roboto",
    mono: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
} as const;

export type FontSizes = typeof FONTS.sizes;
export type FontWeights = typeof FONTS.weights;
export type FontFamilies = typeof FONTS.families;

// Border radius scale
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;

export type Radius = typeof RADIUS;

// Shadow styles
export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

export type Shadow = typeof SHADOWS;

// Custom themes
export const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background.light,
    card: COLORS.surface.light,
    text: COLORS.text.light.primary,
    border: COLORS.border.light,
  },
};

export const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background.dark,
    card: COLORS.surface.dark,
    text: COLORS.text.dark.primary,
    border: COLORS.border.dark,
  },
};

// Animation timings
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export type AnimationTiming = typeof ANIMATION;
