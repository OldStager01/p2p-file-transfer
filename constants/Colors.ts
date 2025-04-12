const tintColorLight = "#2C7BE5"; // Soft blue for light theme
const tintColorDark = "#38B2AC"; // Muted teal for dark theme

export default {
  light: {
    text: "#1F2937", // Very dark gray (better than pure black)
    background: "#F7F9FC", // Soft light background
    tint: tintColorLight, // Primary color
    tabIconDefault: "#A0AEC0", // Muted gray
    tabIconSelected: tintColorLight,
    card: "#FFFFFF", // For surfaces like cards
    border: "#E0E6ED", // Subtle border
    success: "#22C55E",
    warning: "#FBBF24",
    danger: "#EF4444",
  },
  dark: {
    text: "#F9FAFB", // Very light gray for better contrast
    background: "#111827", // Deep slate gray (nicer than pure black)
    tint: tintColorDark, // Primary color
    tabIconDefault: "#718096", // Muted gray
    tabIconSelected: tintColorDark,
    card: "#1F2937", // Dark surface
    border: "#374151", // Darker border
    success: "#22C55E",
    warning: "#FBBF24",
    danger: "#EF4444",
  },
};
