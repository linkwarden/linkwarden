import { StylesConfig } from "react-select";

const font =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji";

export const styles: StylesConfig = {
  option: (styles, state) => ({
    ...styles,
    fontFamily: font,
    cursor: "pointer",
    backgroundColor: state.isSelected ? "oklch(var(--p))" : "inherit",
    "&:hover": {
      backgroundColor: state.isSelected
        ? "oklch(var(--p))"
        : "oklch(var(--nc))",
    },
    transition: "all 50ms",
  }),
  control: (styles, state) => ({
    ...styles,
    fontFamily: font,
    borderRadius: "0.375rem",
    border: state.isFocused
      ? "1px solid oklch(var(--p))"
      : "1px solid oklch(var(--nc))",
    boxShadow: "none",
    minHeight: "2.6rem",
  }),
  container: (styles, state) => ({
    ...styles,
    height: "full",
    borderRadius: "0.375rem",
    lineHeight: "1.25rem",
    // "@media screen and (min-width: 1024px)": {
    //   fontSize: "0.875rem",
    // },
  }),
  input: (styles) => ({
    ...styles,
    cursor: "text",
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    cursor: "pointer",
  }),
  placeholder: (styles) => ({
    ...styles,
    borderColor: "black",
  }),
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: "#0ea5e9",
      color: "white",
    };
  },
  multiValueLabel: (styles) => ({
    ...styles,
    color: "white",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    ":hover": {
      color: "white",
      backgroundColor: "#38bdf8",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
