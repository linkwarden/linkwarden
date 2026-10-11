import { vars } from "nativewind";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { rawTheme, ThemeName } from "./colors";

const hexToRgb = (hex: string) => {
  const [r, g, b] = hex
    .replace(/^#/, "")
    .match(/.{2}/g)!
    .map((h) => parseInt(h, 16));
  return `${r} ${g} ${b}`;
};

const makeVars = (scheme: ThemeName) =>
  vars(
    Object.fromEntries(
      Object.entries(rawTheme[scheme]).map(([key, hex]) => [
        `--color-${key}`,
        hexToRgb(hex),
      ])
    ) as Record<string, string>
  );

export const lightTheme = makeVars("light");
export const darkTheme = makeVars("dark");

// Native stack headers take their iOS light/dark appearance from the
// navigation theme, so it has to follow the app's color scheme.
const makeNavigationTheme = (scheme: ThemeName): Theme => {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: rawTheme[scheme].primary,
      background: rawTheme[scheme]["base-100"],
      card: rawTheme[scheme]["base-100"],
      text: rawTheme[scheme]["base-content"],
      border: rawTheme[scheme]["neutral-content"],
    },
  };
};

export const lightNavigationTheme = makeNavigationTheme("light");
export const darkNavigationTheme = makeNavigationTheme("dark");
