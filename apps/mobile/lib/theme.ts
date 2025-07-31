import { vars } from "nativewind";
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
