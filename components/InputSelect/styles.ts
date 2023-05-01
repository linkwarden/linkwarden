// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

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
      backgroundColor: state.isSelected ? "#0ea5e9" : "#bae6fd",
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
    width: "15rem",
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
  clearIndicator: (styles) => ({
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
