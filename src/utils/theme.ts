import { MD3LightTheme, configureFonts } from "react-native-paper";

const fontConfig = {
  displaySmall: {
    fontFamily: "System",
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 44,
    fontSize: 34,
  },
  displayMedium: {
    fontFamily: "System",
    fontWeight: "500" as const,
    letterSpacing: 0,
    lineHeight: 40,
    fontSize: 28,
  },
  titleLarge: {
    fontFamily: "System",
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 28,
    fontSize: 22,
  },
  bodyLarge: {
    fontFamily: "System",
    fontWeight: "400" as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: "System",
    fontWeight: "400" as const,
    letterSpacing: 0.15,
    lineHeight: 20,
    fontSize: 14,
  },
  labelLarge: {
    fontFamily: "System",
    fontWeight: "600" as const,
    letterSpacing: 0.1,
    lineHeight: 20,
    fontSize: 14,
  },
};

const baseTheme = MD3LightTheme;

export const paperTheme: typeof baseTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: "#3BAFDA",
    secondary: "#6BD6B2",
    tertiary: "#F6B4A5",
    elevation: {
      ...baseTheme.colors.elevation,
      level2: "#F3FAFF",
    },
    background: "#F4F9FB",
    surface: "#FFFFFF",
    surfaceVariant: "#E0F3FF",
    outline: "#9CCCE0",
  },
  fonts: configureFonts({ config: fontConfig }),
};

