import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { READER_VIEW_DEFAULTS } from "@linkwarden/lib/readerViewStyles";
import { rawTheme, ThemeName } from "@/lib/colors";

export const READER_FONT_FAMILIES = [
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "caveat",
  "bentham",
] as const;

export const READER_FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "30px",
  "32px",
  "34px",
  "36px",
  "38px",
  "40px",
  "42px",
  "44px",
  "46px",
  "48px",
  "50px",
] as const;

export const READER_LINE_HEIGHTS = [
  "1",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.7",
  "1.8",
  "1.9",
  "2",
  "2.1",
  "2.2",
  "2.3",
  "2.4",
  "2.5",
  "2.6",
  "2.7",
  "2.8",
  "2.9",
  "3",
] as const;

export const READER_BACKGROUND_COLORS = [
  "system",
  "light",
  "dark",
  "sepia",
] as const;

export type ReaderFontFamily = (typeof READER_FONT_FAMILIES)[number];
export type ReaderFontSize = (typeof READER_FONT_SIZES)[number];
export type ReaderLineHeight = (typeof READER_LINE_HEIGHTS)[number];
export type ReaderBackgroundColor =
  (typeof READER_BACKGROUND_COLORS)[number];

export type ReaderSettings = {
  readableFontFamily: ReaderFontFamily;
  readableFontSize: ReaderFontSize;
  readableLineHeight: ReaderLineHeight;
  readableBackgroundColor: ReaderBackgroundColor;
};

export const READER_DEFAULTS: ReaderSettings = {
  readableFontFamily: "sans-serif",
  readableFontSize: `${READER_VIEW_DEFAULTS.fontSize}px`,
  readableLineHeight: String(
    READER_VIEW_DEFAULTS.lineHeight
  ) as ReaderLineHeight,
  readableBackgroundColor: "system",
};

const READER_SEPIA_THEME = {
  primary: "#8C6239",
  secondary: "#A47A52",
  accent: "#8C6239",
  neutral: "#8A7558",
  "neutral-content": "#D5C8B1",
  "base-100": "#F5ECD9",
  "base-200": "#EBDDCA",
  "base-content": "#433422",
  info: "#C2D3E0",
  success: "#5F8A5D",
  warning: "#C9A227",
  error: "#B45309",
} as const;

type ReaderStore = {
  reader: ReaderSettings;
  setReader: () => Promise<void>;
  updateReader: (patch: Partial<ReaderSettings>) => Promise<void>;
  resetReader: () => Promise<void>;
};

function parseStoredReaderSettings(value: string | null): Partial<ReaderSettings> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as Partial<ReaderSettings>;

    return {
      readableBackgroundColor: parsed.readableBackgroundColor,
      readableFontFamily: parsed.readableFontFamily,
      readableFontSize: parsed.readableFontSize,
      readableLineHeight: parsed.readableLineHeight,
    };
  } catch {
    return {};
  }
}

export function getReadableFontFamily(fontFamily: ReaderFontFamily) {
  if (fontFamily === "caveat") {
    if (Platform.OS === "android") {
      return '"casual", "Comic Sans MS", cursive';
    }

    return '"Caveat", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
  }

  if (fontFamily === "bentham") {
    return '"Bentham", "Palatino Linotype", "Book Antiqua", Georgia, serif';
  }

  if (fontFamily === "monospace") {
    return '"Courier New", Courier, monospace';
  }

  return fontFamily;
}

export function resolveReaderTheme(
  backgroundColor: ReaderBackgroundColor,
  systemTheme: ThemeName
) {
  if (backgroundColor === "system") {
    return {
      theme: rawTheme[systemTheme],
      isDark: systemTheme === "dark",
    };
  }

  if (backgroundColor === "dark") {
    return {
      theme: rawTheme.dark,
      isDark: true,
    };
  }

  if (backgroundColor === "sepia") {
    return {
      theme: READER_SEPIA_THEME,
      isDark: false,
    };
  }

  return {
    theme: rawTheme.light,
    isDark: false,
  };
}

const useReaderStore = create<ReaderStore>((set, get) => ({
  reader: READER_DEFAULTS,
  setReader: async () => {
    const storedReader = parseStoredReaderSettings(
      await AsyncStorage.getItem("reader")
    );

    set((state) => ({
      reader: {
        ...state.reader,
        ...storedReader,
      },
    }));
  },
  updateReader: async (patch) => {
    const merged = {
      ...get().reader,
      ...patch,
    };

    await AsyncStorage.setItem("reader", JSON.stringify(merged));
    set({ reader: merged });
  },
  resetReader: async () => {
    await AsyncStorage.setItem("reader", JSON.stringify(READER_DEFAULTS));
    set({ reader: READER_DEFAULTS });
  },
}));

export default useReaderStore;
