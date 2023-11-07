import { StylesConfig } from "react-select";

const font =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji";

export const styles: StylesConfig = {
  option: (styles, state) => ({
    ...styles,
    fontFamily: font,
    cursor: "pointer",
    backgroundColor: state.isSelected ? "#0ea5e9" : "inherit",
    "&:hover": {
      backgroundColor: state.isSelected ? "#0ea5e9" : "#e2e8f0",
    },
    transition: "all 50ms",
  }),
  control: (styles) => ({
    ...styles,
    fontFamily: font,
    border: "none",
  }),
  container: (styles) => ({
    ...styles,
    border: "1px solid #e0f2fe",
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
};
