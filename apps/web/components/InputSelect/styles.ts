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
    transition: "all 100ms",
  }),
  menu: (styles) => ({
    ...styles,
    zIndex: 10,
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
    color: "oklch(var(--n))",
  }),
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: "oklch(var(--b2))",
      color: "oklch(var(--bc))",
      display: "flex",
      alignItems: "center",
      gap: "0.1rem",
      marginRight: "0.4rem",
    };
  },
  multiValueLabel: (styles) => ({
    ...styles,
    color: "oklch(var(--bc))",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    height: "1.2rem",
    width: "1.2rem",
    borderRadius: "100px",
    transition: "all 100ms",
    color: "oklch(var(--w))",
    ":hover": {
      color: "red",
      backgroundColor: "oklch(var(--nc))",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
