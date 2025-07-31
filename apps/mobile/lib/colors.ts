// lib/theme/colors.ts
export type ThemeName = "light" | "dark";

export const rawTheme = {
  light: {
    primary: "#0369A1",
    secondary: "#0891B2",
    accent: "#6D28D9",
    neutral: "#6B7280",
    "neutral-content": "#D1D5DB",
    "base-100": "#FFFFFF",
    "base-200": "#F3F4F6",
    "base-content": "#0A0A0A",
    info: "#A5F3FC",
    success: "#22C55E",
    warning: "#FACC15",
    error: "#DC2626",
  },
  dark: {
    primary: "#7DD3FC",
    secondary: "#22D3EE",
    accent: "#6D28D9",
    neutral: "#9CA3AF",
    "neutral-content": "#404040",
    "base-100": "#171717",
    "base-200": "#262626",
    "base-content": "#FAFAFA",
    info: "#009EE4",
    success: "#00B17D",
    warning: "#EAC700",
    error: "#F1293C",
  },
};
